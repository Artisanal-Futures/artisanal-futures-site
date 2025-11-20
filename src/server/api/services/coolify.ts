import { env } from "~/env";
import type { WebsiteProvision } from "@prisma/client";
import yaml from "js-yaml";
import crypto from "node:crypto";

interface CoolifyProject {
  uuid: string;
  name: string;
  description?: string;
}

interface CoolifyService {
  uuid: string;
  name: string;
  fqdn?: string;
  status?: string;
}

interface CoolifyDeployment {
  uuid: string;
  status: string;
  deployment_url?: string;
}

function generatePassword(length = 32): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

class CoolifyClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = env.COOLIFY_API;
    this.token = env.COOLIFY_ADMIN_SAFE_API_TOKEN;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    console.log("Calling Coolify:", url);
    console.log("Method:", options.method || "GET");

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Coolify API Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async createProject(
    name: string,
    description?: string
  ): Promise<CoolifyProject> {
    return this.request<CoolifyProject>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  async createDockerComposeService(params: {
    projectUuid: string;
    serverUuid: string;
    environmentName: string;
    name: string;
    dockerComposeRaw: string; 
  }): Promise<CoolifyService> {
    return this.request<CoolifyService>("/applications/dockercompose", {
      method: "POST",
      body: JSON.stringify({
        project_uuid: params.projectUuid,
        server_uuid: params.serverUuid,
        environment_name: params.environmentName,
        name: params.name,
        docker_compose_raw: params.dockerComposeRaw,
        instant_deploy: false,
      }),
    });
  }

  async deployService(serviceUuid: string): Promise<CoolifyDeployment> {
    return this.request<CoolifyDeployment>("/deploy", {
      method: "POST",
      body: JSON.stringify({ uuid: serviceUuid }),
    });
  }

  async deleteService(serviceUuid: string): Promise<void> {
    await this.request(`/services/${serviceUuid}`, {
      method: "DELETE",
    });
  }

  async deleteEnvironment(environmentName: string, projectUuid: string): Promise<void> {
    await this.request(`/projects/${projectUuid}/environments/${environmentName}`, {
      method: "DELETE",
    });
  }

  async deleteProject(projectUuid: string): Promise<void> {
    await this.request(`/projects/${projectUuid}`, {
      method: "DELETE",
    });
  }
}

const coolifyClient = new CoolifyClient();

/**
 * Generate a single Docker Compose stack that contains:
 *  - mysql service
 *  - wordpress service (custom image)
 *
 * WordPress connects to MySQL via WORDPRESS_DB_HOST=mysql:3306
 * which matches the service name and works on the same network.
 */
function generateWordPressCompose(
  provision: WebsiteProvision,
  dbCreds: {
    database: string;
    user: string;
    password: string;
    rootPassword: string;
  }
): string {
  const { database, user, password, rootPassword } = dbCreds;
  const config = provision.config as {
    adminUser: string;
    adminPassword: string;
    adminEmail: string;
  };

  const wordpressImage = env.WORDPRESS_DOCKER_REGISTRY;

  const composeObj = {
    version: "3.8",
    services: {
      mysql: {
        image: "mysql:8",
        restart: "always",
        environment: {
          MYSQL_ROOT_PASSWORD: rootPassword,
          MYSQL_DATABASE: database,
          MYSQL_USER: user,
          MYSQL_PASSWORD: password,
        },
        volumes: ["mysql-data:/var/lib/mysql"],
        healthcheck:{
          test: ["CMD", "true"]
        },
      },

      wordpress: {
        image: wordpressImage,
        restart: "always",
        depends_on: ["mysql"],
        environment: {
          // DB connection
          WORDPRESS_DB_HOST: "mysql:3306",
          WORDPRESS_DB_USER: user,
          WORDPRESS_DB_PASSWORD: password,
          WORDPRESS_DB_NAME: database,

          // Custom setup vars
          WP_URL: '${SERVICE_FQDN_WORDPRESS}',
          WP_TITLE: provision.businessName,
          WP_ADMIN_USER: config.adminUser,
          WP_ADMIN_PASSWORD: config.adminPassword,
          WP_ADMIN_EMAIL: config.adminEmail,
        },

        healthcheck:{
          test: ["CMD", "true"]
        },

        expose: ["80"],
      },
    },
    volumes: {
      "mysql-data": {},
    },
  };

  return yaml.dump(composeObj);
}

export async function createCoolifyDeployment(
  provision: WebsiteProvision
): Promise<{
  projectUuid: string;
  serviceUuid: string;
  serverUuid: string;
  fqdn?: string;
  domain: string;
}> {
  try {
    const project = await coolifyClient.createProject(
      `${provision.businessName}`,
      `WordPress site for ${provision.businessName}`
    );

    const dbCreds = {
      database: "wordpress",
      user: "wp_" + provision.businessName,
      password: generatePassword(32),
      rootPassword: generatePassword(32),
    };

    const dockerCompose = generateWordPressCompose(provision, dbCreds);
    const dockerComposeBase64 = Buffer.from(dockerCompose).toString("base64");

    const service = await coolifyClient.createDockerComposeService({
      projectUuid: project.uuid,
      serverUuid: env.COOLIFY_UUID,
      environmentName: "production",
      name: provision.businessName,
      dockerComposeRaw: dockerComposeBase64,
    });

    const domain = `wordpress-${service.uuid}.artisanalfutures.shop`;

    // await coolifyClient.updateService(service.uuid,[`https://${domain}`]);
    // Explicit deploy step (since we set instant_deploy: false above)
    await coolifyClient.deployService(service.uuid);


    return {
      projectUuid: project.uuid,
      serviceUuid: service.uuid,
      serverUuid: env.COOLIFY_UUID,
      fqdn: service.fqdn,
      domain,
    };
  } catch (error) {
    console.error("Coolify deployment error:", error);
    throw new Error(
      `Failed to deploy to Coolify: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteCoolifyDeployment(
  serviceUuid: string,
  projectUuid: string
): Promise<void> {
  try {
    await coolifyClient.deleteService(serviceUuid);
    await coolifyClient.deleteEnvironment("production", projectUuid);
    await coolifyClient.deleteProject(projectUuid);
  } catch (error) {
    console.error("Failed to delete deployment:", error);
    throw error;
  }
}

export async function verifyDeployment(url: string, maxRetries = 30, delayMs = 5000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.log(`Verification attempt ${i + 1} failed, retrying...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  return false;
}


export { coolifyClient };