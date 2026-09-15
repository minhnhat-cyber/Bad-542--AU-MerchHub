import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export interface ProductionSecrets {
  databaseUrl: string;
  appJwtSecret: string;
  geminiApiKey: string;
}

export async function loadProductionSecrets(
  vaultUrl: string,
): Promise<ProductionSecrets> {
  const client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  const [databaseUrl, appJwtSecret, geminiApiKey] = await Promise.all([
    client.getSecret("database-url"),
    client.getSecret("app-jwt-secret"),
    client.getSecret("gemini-api-key"),
  ]);

  if (!databaseUrl.value || !appJwtSecret.value || !geminiApiKey.value) {
    throw new Error("One or more required production secrets are unavailable");
  }

  return {
    databaseUrl: databaseUrl.value,
    appJwtSecret: appJwtSecret.value,
    geminiApiKey: geminiApiKey.value,
  };
}
