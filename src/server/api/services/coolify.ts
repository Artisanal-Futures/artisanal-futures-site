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

  // async getService(serviceUuid: string): Promise<CoolifyService> {
  //   return this.request<CoolifyService>(`/applications/${serviceUuid}`);
  // }

  // async updateService(serviceUuid: string, domains: string): Promise<void> {
  //   await this.request(`/applications/${serviceUuid}`, {
  //     method: "PATCH",
  //     body: JSON.stringify({ domains })
  //   })
  // }

  async deleteService(serviceUuid: string): Promise<void> {
    await this.request(`/applications/${serviceUuid}`, {
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

  const domain =
    provision.hasCustomDomain && provision.customDomain
      ? provision.customDomain
      : `${provision.subdomain}.artisanalfutures.shop`;

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
        exclude_from_hc: true,
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
          WP_URL: `https://${domain}`,
          WP_TITLE: provision.businessName,
          WP_ADMIN_USER: config.adminUser,
          WP_ADMIN_PASSWORD: config.adminPassword,
          WP_ADMIN_EMAIL: config.adminEmail,
        },

        exclude_from_hc: true,

        labels: [
          "traefik.enable=true",
          `traefik.http.routers.wordpress-${provision.id}.rule=Host(\`${domain}\`) && PathPrefix(\`/\`)`,
          `traefik.http.routers.wordpress-${provision.id}.entrypoints=websecure`,
          `traefik.http.routers.wordpress-${provision.id}.tls.certresolver=letsencrypt`,
          `traefik.http.routers.wordpress-${provision.id}.tls=true`,
        ],
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
      `${provision.businessName} - ${provision.subdomain}`,
      `WordPress site for ${provision.businessName}`
    );

    const dbCreds = {
      database: "wordpress",
      user: "wp_" + provision.subdomain.slice(0, 8),
      password: generatePassword(32),
      rootPassword: generatePassword(32),
    };

    const dockerCompose = generateWordPressCompose(provision, dbCreds);
    const dockerComposeBase64 = Buffer.from(dockerCompose).toString("base64");

    const domain =
      provision.hasCustomDomain && provision.customDomain
        ? provision.customDomain
        : `${provision.subdomain}.artisanalfutures.shop`;

    const service = await coolifyClient.createDockerComposeService({
      projectUuid: project.uuid,
      serverUuid: env.COOLIFY_UUID,
      environmentName: "production",
      name: provision.subdomain,
      dockerComposeRaw: dockerComposeBase64,
    });

    // Explicit deploy step (since we set instant_deploy: false above)
    await coolifyClient.deployService(service.uuid);

    // await coolifyClient.updateService(service.uuid, domain);

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

export async function cancelCoolifyDeployment(
  serviceUuid: string
): Promise<void> {
  try {
    await coolifyClient.deleteService(serviceUuid);
  } catch (error) {
    console.error("Failed to cancel deployment:", error);
    throw error;
  }
}

export { coolifyClient };


// interface CoolifyProject {
//     uuid: string;
//     name: string;
//     description?: string;
// }

// interface CoolifyApplication {
//     uuid: string;
//     name: string;
//     fqdn: string;
//     status: string;
// }

// interface CoolifyDatabase {
//   uuid: string;
//   name: string;
//   type: string;
//   host: string;
//   port: number;
//   username?: string;
//   password?: string;
// }

// interface CoolifyDeployment {
//     uuid: string;
//     status: string;
//     deployment_url?: string;
// }

// class CoolifyClient {
//     private baseUrl: string;
//     private token: string;

//     constructor(){
//         this.baseUrl = env.COOLIFY_API;
//         this.token = env.COOLIFY_ADMIN_SAFE_API_TOKEN;
//     }

//     private async fetch<T>(
//         endpoint: string,
//         options: RequestInit = {}
//     ): Promise<T> {
//         const url = `${this.baseUrl}/api/v1${endpoint}`;

//         console.log("Calling Coolify:", url); 
//         console.log("Method:", options.method || "GET");

//         const response = await fetch(url, {
//             ...options,
//             headers: {
//                 "Authorization": `Bearer ${this.token}`,
//                 "Content-Type": "application/json",
//                 "Accept": "application/json",
//                 ...options.headers,
//             },
//         });

//         if(!response.ok){
//             const error = await response.text();
//             throw new Error(`Coolify API Error: ${response.status} - ${error}`);
//         }

//         return response.json() as Promise<T>;
//     }

//     async createProject(name: string, description?: string): Promise<CoolifyProject> {
//         return this.fetch<CoolifyProject>("/projects", {
//             method: "POST",
//             body: JSON.stringify({ name, description }),
//         });
//     }

//     async createDockerComposeApp(params: {
//         projectUuid: string;
//         serverUuid: string;
//         environmentName: string;
//         name: string;
//         dockerComposeRaw: string;
//         domains?: string[];
//     }): Promise<CoolifyApplication> {
//         return this.fetch<CoolifyApplication>("/applications/dockercompose", {
//             method: "POST",
//             body: JSON.stringify({
//                 project_uuid: params.projectUuid,
//                 server_uuid: params.serverUuid,
//                 environment_name: params.environmentName,
//                 name: params.name,
//                 docker_compose_raw: params.dockerComposeRaw,
//                 domains: params.domains,
//                 instant_deploy: true,
//             }),
//         });
//     }

//     async deployApplication(appUuid: string): Promise<CoolifyDeployment> {
//         return this.fetch<CoolifyDeployment>(`/deploy`, {
//             method: "POST",
//             body: JSON.stringify({ uuid: appUuid }),
//         });
//     }

//     async getApplicationStatus(appUuid: string): Promise<CoolifyApplication> {
//         return this.fetch<CoolifyApplication>(`/applications/${appUuid}`);
//     }

//     async deleteApplication(appUuid: string): Promise<void>{
//         await this.fetch(`/applications/${appUuid}`, {
//             method: "DELETE",
//         });
//     }

//     async createDatabase(params: {
//       projectUuid: string;
//       serverUuid: string;
//       environmentName: string;
//       name: string;
//       type: 'mysql' | 'postgresql' | 'mariadb';
//     }): Promise<CoolifyDatabase> {
//       const endpoint = `/databases/${params.type}`;
      
//       return this.fetch<CoolifyDatabase>(endpoint, {
//         method: "POST",
//         body: JSON.stringify({
//           project_uuid: params.projectUuid,
//           server_uuid: params.serverUuid,
//           environment_name: params.environmentName,
//           name: params.name,
//           instant_deploy: true,
//         }),
//       });
//     }
// }

// const coolifyClient = new CoolifyClient();

// function generateWordPressCompose(
//   provision: WebsiteProvision,
//   database: CoolifyDatabase
// ): string {
//   const config = provision.config as {
//     adminUser: string;
//     adminPassword: string;
//     adminEmail: string;
//   };

//   const domain = provision.hasCustomDomain && provision.customDomain
//     ? provision.customDomain
//     : `${provision.subdomain}.artisanalfutures.shop`;

//   const wordpressImage = env.WORDPRESS_DOCKER_REGISTRY;

//   const composeObj = {
//     version: '3.8',
//     services: {
//       wordpress: {
//         image: wordpressImage,
//         environment: {
//           WORDPRESS_DB_HOST: `${database.host}:${database.port || 3306}`,
//           WORDPRESS_DB_USER: database.username || 'wordpress',
//           WORDPRESS_DB_PASSWORD: '${DB_PASSWORD}', 
//           WORDPRESS_DB_NAME: database.name,
          
//           WP_URL: `https://${domain}`,
//           WP_TITLE: provision.businessName,
//           WP_ADMIN_USER: config.adminUser,
//           WP_ADMIN_PASSWORD: config.adminPassword,
//           WP_ADMIN_EMAIL: config.adminEmail,
//         },
//         labels: [
//           'coolify.managed=true',
//           'traefik.enable=true',
//           `traefik.http.routers.wordpress-${provision.id}.rule=Host(\`${domain}\`)`,
//           `traefik.http.routers.wordpress-${provision.id}.entrypoints=websecure`,
//           `traefik.http.routers.wordpress-${provision.id}.tls.certresolver=letsencrypt`,
//         ],
//       },
//     },
//   };

//   return yaml.dump(composeObj);
// }

// export async function createCoolifyDeployment(provision: WebsiteProvision): Promise<{
//   projectUuid: string;
//   appUuid: string;
//   databaseUuid: string;
//   serverUuid: string;
// }> {
//   try {
//     const project = await coolifyClient.createProject(
//       `${provision.businessName} - ${provision.subdomain}`,
//       `WordPress site for ${provision.businessName}`
//     );

//     const database = await coolifyClient.createDatabase({
//       projectUuid: project.uuid,
//       serverUuid: env.COOLIFY_UUID,
//       environmentName: "production",
//       name: `${provision.subdomain}-db`,
//       type: 'mysql',
//     });

//     console.log("Database created:", database.uuid);

//     const dockerCompose = generateWordPressCompose(provision, database);
//     const dockerComposeBase64 = Buffer.from(dockerCompose).toString("base64");

//     const domain = provision.hasCustomDomain && provision.customDomain
//       ? provision.customDomain
//       : `${provision.subdomain}.artisanalfutures.shop`;

//     const app = await coolifyClient.createDockerComposeApp({
//       projectUuid: project.uuid,
//       serverUuid: env.COOLIFY_UUID,
//       environmentName: "production",
//       name: provision.subdomain,
//       dockerComposeRaw: dockerComposeBase64,
//     });

//     await coolifyClient.deployApplication(app.uuid);

//     return {
//       projectUuid: project.uuid,
//       appUuid: app.uuid,
//       databaseUuid: database.uuid,
//       serverUuid: env.COOLIFY_UUID,
//     };
//   } catch (error) {
//     console.error("Coolify deployment error:", error);
//     throw new Error(`Failed to deploy to Coolify: ${error instanceof Error ? error.message : "Unknown error"}`);
//   }
// }

// export async function checkDeploymentStatus(appUuid: string): Promise<{
//     status: string;
//     url?: string;
// }> {
//     try{
//         const app = await coolifyClient.getApplicationStatus(appUuid);

//         return {
//             status: app.status, 
//             url: app.fqdn,
//         };
//     } catch (error) {
//         console.error("Failed to check deployment status:", error);
//         throw error;
//     }
// }

// export async function cancelCoolifyDeployment(appUuid: string): Promise<void> {
//     try {
//         await coolifyClient.deleteApplication(appUuid);
//     } catch (error) {
//         console.error("Failed to cancel deployment:", error);
//         throw error;
//     }
// }

// export { coolifyClient }
