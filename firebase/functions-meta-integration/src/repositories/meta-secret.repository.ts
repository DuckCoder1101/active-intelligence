import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

function projectPath(): string {
  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("GCLOUD_PROJECT não definido no ambiente da function.");
  }
  return `projects/${projectId}`;
}

/**
 * Guarda o token de acesso do Facebook de cada empresa no Secret Manager —
 * um secret por empresa (`facebook-ads-token-{companyId}`), nunca no
 * Firestore. `secretRef` (salvo em `FacebookAdsIntegrationDocument`) é o
 * nome completo do secret (`projects/.../secrets/...`).
 */
export class MetaSecretRepository {
  private static secretId(companyId: string): string {
    return `facebook-ads-token-${companyId}`;
  }

  static async saveToken(companyId: string, token: string): Promise<string> {
    const parent = projectPath();
    const secretName = `${parent}/secrets/${this.secretId(companyId)}`;

    const exists = await client
      .getSecret({ name: secretName })
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      await client.createSecret({
        parent,
        secretId: this.secretId(companyId),
        secret: { replication: { automatic: {} } },
      });
    }

    await client.addSecretVersion({
      parent: secretName,
      payload: { data: Buffer.from(token, "utf8") },
    });

    return secretName;
  }

  static async deleteSecret(secretRef: string): Promise<void> {
    await client.deleteSecret({ name: secretRef });
  }

  static async getToken(secretRef: string): Promise<string> {
    const [version] = await client.accessSecretVersion({
      name: `${secretRef}/versions/latest`,
    });

    const data = version.payload?.data;
    if (!data) {
      throw new Error(`Secret ${secretRef} não tem payload.`);
    }
    return data.toString();
  }
}
