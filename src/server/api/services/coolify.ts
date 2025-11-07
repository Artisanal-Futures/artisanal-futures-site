import { env } from "~/env";
import type { WebsiteProvision } from "@prisma/client";
import { StringColorFormat } from "@faker-js/faker";

interface CoolifyProject {
    uuid: string;
    name: string;
    description?: string;
}

interface CoolifyApplication {
    uuid: string;
    name: string;
    fqdn: string;
    status: string;
}

interface CoolifyDeployment {
    uuid: string;
    status: string;
    deployment_url?: string;
}

class CoolifyClient {
    private baseUrl: string;
    private token: string;

    constructor(){
        this.baseUrl = env.COOLIFY_API;
        this.token = env.COOLIFY_ADMIN_SAFE_API_TOKEN;
    }

    private async fetch<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}/api/v1${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Bearer ${this.token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...options.headers,
            },
        });

        if(!response.ok){
            const error = await response.text();
            throw new Error(`Coolify API Error: ${response.status} - ${error}`);
        }

        return response.json() as Promise<T>;
    }

    async createProject(name: string, description?: string): Promise<CoolifyProject> {
        return this.fetch<CoolifyProject>("/projects", {
            method: "POST",
            body: JSON.stringify({ name, description }),
        });
    }

    async createDockerComposeApp(params: {
        projectUuid: string;
        serverUuid: string;
        environmentName: string;
        name: string;
        dockerComposeRaw: string;
        domains?: string[];
    }): Promise<CoolifyApplication> {
        return this.fetch<CoolifyApplication>("/applications/dockercompose", {
            method: "POST",
            body: JSON.stringify({
                project_uuid: params.projectUuid,
                server_uuid: params.serverUuid,
                environment_name: params.environmentName,
                name: params.name,
                docker_compose_raw: params.dockerComposeRaw,
                domains: params.domains,
            }),
        });
    }

    async deployApplication(appUuid: string): Promise<CoolifyDeployment> {
        return this.fetch<CoolifyDeployment>(`/applications/${appUuid}/deploy`, {
            method: "POST",
        });
    }

    async getApplicationStatus(appUuid: string): Promise<CoolifyApplication> {
        return this.fetch<CoolifyApplication>(`/applications/${appUuid}`);
    }

    async deleteApplication(appUuid: string): Promise<void>{
        await this.fetch(`/applications/${appUuid}`, {
            method: "DELETE",
        });
    }
}

const coolifyClient = new CoolifyClient();

function generateWordPressCompose(provision: WebsiteProvision): string {
    const config = provision.config as {
        adminUser: string;
        adminPassword: string;
        adminEmail: string;
        plugins?: string[];
        theme?: string;
    };

    const domain = provision.hasCustomDomain && provision.customDomain
        ? provision.customDomain
        : `${provision.subdomain}.artisanalfutures.org`;

    const wordpressImage = env.WORDPRESS_DOCKER_REGISTRY;

    const compose = 
        `
            version: '3.8'

            services:
                db: 
                    image:mysql:8.0.40
                    environment: 
                        MYSQL_DATABASE: wordpress
                        MYSQL_USER: wordpress
                        MYSQL_PASSWORD: \${SERVICE_PASSWORD_MYSQL}
                        MYSQL_ROOT_PASSWORD: \${SERVICE_PASSWORD_MYSQL_ROOT}
                    volumes:
                        - db_data:/var/lib/mysql

            wordpress:
                image: ${wordpressImage}
                environment:
                    WORDPRESS_DB_HOST: db:3306
                    WORDPRESS_DB_USER: wordpress
                    WORDPRESS_DB_PASSWORD: \${SERVICE_PASSWORD_MYSQL}
                    WORDPRESS_DB_NAME: wordpress

                    WP_URL: https://${domain}
                    WP_TITLE: ${provision.businessName}
                    WP_ADMIN_USER: ${config.adminUser}
                    WP_ADMIN_PASSWORD: ${config.adminPassword}
                    WP_ADMIN_EMAIL: ${config.adminEmail}
                labels:
                    - "coolify.managed=true"    
                    - "traefik.enable="true"
                    - "traefik.http.routers.wordpress-${provision.id}.rule=Host(\`${domain}\`)"
                    - "traefik.http.routers.wordpress-${provision.id}.entrypoints=websecure"
                    - "traefik.http.routers.wordpress-${provision.id}.tls.certresolver=letsencrypt"
                depends_on:
                    - db
            volumes:
                db_data:
        `;
        return compose;
}

export async function createCoolifyDeployment(provision: WebsiteProvision): Promise<{
    projectUuid: string;
    appUuid: string;
    serverUuid: string;
}> {
    try {
        const project = await coolifyClient.createProject(
            `${provision.businessName} - ${provision.subdomain}`,
            `WordPress site for ${provision.businessName}`
        );
        
        const dockerCompose = generateWordPressCompose(provision);
        const dockerComposeBase64 = Buffer.from(dockerCompose).toString("base64");

        const domain = provision.hasCustomDomain && provision.customDomain
            ? provision.customDomain
            : `${provision.subdomain}.artisanalfutures.org`;

        const app = await coolifyClient.createDockerComposeApp({
            projectUuid: project.uuid,
            serverUuid: env.COOLIFY_UUID,
            environmentName: "production",
            name: provision.subdomain,
            dockerComposeRaw: dockerComposeBase64,
            domains: [domain],
        });

        await coolifyClient.deployApplication(app.uuid);

        return {
            projectUuid: project.uuid,
            appUuid: app.uuid,
            serverUuid: env.COOLIFY_UUID,
        };
    } catch (error) {
        console.error("Coolify deployment error:", error);
        throw new Error(`Failed to deploy to Coolify: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function checkDeploymentStatus(appUuid: string): Promise<{
    status: string;
    url?: string;
}> {
    try{
        const app = await coolifyClient.getApplicationStatus(appUuid);

        return {
            status: app.status,
            url: app.fqdn,
        };
    } catch (error) {
        console.error("Failed to check deployment status:", error);
        throw error;
    }
}

export async function cancelCoolifyDeployment(appUuid: string): Promise<void> {
    try {
        await coolifyClient.deleteApplication(appUuid);
    } catch (error) {
        console.error("Failed to cancel deployment:", error);
        throw error;
    }
}

export { coolifyClient }
