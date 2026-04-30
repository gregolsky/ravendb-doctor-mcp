import { describe, it, expect } from "vitest";
import { redactAdminDatabasesRecord } from "../src/util/redact.js";

function redact(obj: unknown): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(obj));
  return redactAdminDatabasesRecord(clone) as Record<string, unknown>;
}

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, key) => {
    if (cur === null || cur === undefined) return cur;
    if (Array.isArray(cur)) return (cur as unknown[])[Number(key)];
    return (cur as Record<string, unknown>)[key];
  }, obj);
}

describe("redactAdminDatabasesRecord", () => {
  it("redacts BackupEncryptionSettings.Key (parent-scoped)", () => {
    const result = redact({
      DatabaseName: "testdb",
      PeriodicBackups: [
        { BackupEncryptionSettings: { Key: "super-secret-key", EncryptionMode: "UseProvidedKey" } },
      ],
    });
    expect(get(result, "PeriodicBackups.0.BackupEncryptionSettings.Key")).toBeNull();
    expect(get(result, "PeriodicBackups.0.BackupEncryptionSettings.EncryptionMode")).toBe("UseProvidedKey");
  });

  it("does not redact a bare Key field outside BackupEncryptionSettings", () => {
    const result = redact({ SomeObject: { Key: "not-secret", Value: "foo" } });
    expect(get(result, "SomeObject.Key")).toBe("not-secret");
  });

  it("redacts AWS S3 credentials", () => {
    const result = redact({
      PeriodicBackups: [
        {
          S3Settings: {
            BucketName: "my-bucket",
            AwsAccessKey: "AKIAIOSFODNN7EXAMPLE",
            AwsSecretKey: "wJalrXUtnFEMI/K7MDENG",
            AwsSessionToken: "session-token-123",
            RemoteFolderName: "backups",
          },
        },
      ],
    });
    const s3 = get(result, "PeriodicBackups.0.S3Settings") as Record<string, unknown>;
    expect(s3["BucketName"]).toBe("my-bucket");
    expect(s3["RemoteFolderName"]).toBe("backups");
    expect(s3["AwsAccessKey"]).toBeNull();
    expect(s3["AwsSecretKey"]).toBeNull();
    expect(s3["AwsSessionToken"]).toBeNull();
  });

  it("redacts Azure credentials", () => {
    const result = redact({
      PeriodicBackups: [
        {
          AzureSettings: {
            StorageContainer: "container",
            AccountName: "myaccount",
            AccountKey: "base64-account-key==",
            SasToken: "?sv=2020-08-04",
            RemoteFolderName: "backups",
          },
        },
      ],
    });
    const azure = get(result, "PeriodicBackups.0.AzureSettings") as Record<string, unknown>;
    expect(azure["StorageContainer"]).toBe("container");
    expect(azure["AccountName"]).toBe("myaccount");
    expect(azure["RemoteFolderName"]).toBe("backups");
    expect(azure["AccountKey"]).toBeNull();
    expect(azure["SasToken"]).toBeNull();
  });

  it("redacts FTP credentials", () => {
    const result = redact({
      PeriodicBackups: [
        {
          FtpSettings: {
            Url: "ftp://server.com",
            Password: "ftp-pass-123",
            CertificateAsBase64: "MIIC+zCCAeO...",
          },
        },
      ],
    });
    const ftp = get(result, "PeriodicBackups.0.FtpSettings") as Record<string, unknown>;
    expect(ftp["Url"]).toBe("ftp://server.com");
    expect(ftp["Password"]).toBeNull();
    expect(ftp["CertificateAsBase64"]).toBeNull();
  });

  it("redacts Google Cloud credentials", () => {
    const result = redact({
      PeriodicBackups: [
        {
          GoogleCloudSettings: {
            BucketName: "my-gcs-bucket",
            GoogleCredentialsJson: '{"type":"service_account"}',
          },
        },
      ],
    });
    const gcs = get(result, "PeriodicBackups.0.GoogleCloudSettings") as Record<string, unknown>;
    expect(gcs["BucketName"]).toBe("my-gcs-bucket");
    expect(gcs["GoogleCredentialsJson"]).toBeNull();
  });

  it("redacts SQL connection strings", () => {
    const result = redact({
      SqlConnectionStrings: {
        MySqlConn: {
          Name: "MySqlConn",
          ConnectionString: "Server=myserver;Database=mydb;User Id=admin;Password=secret;",
        },
      },
    });
    const conn = get(result, "SqlConnectionStrings.MySqlConn") as Record<string, unknown>;
    expect(conn["Name"]).toBe("MySqlConn");
    expect(conn["ConnectionString"]).toBeNull();
  });

  it("redacts Elasticsearch credentials", () => {
    const result = redact({
      ElasticSearchConnectionStrings: {
        MyEs: {
          Name: "MyEs",
          Nodes: ["https://es.example.com"],
          Authentication: {
            ApiKey: { ApiKey: "my-api-key", ApiKeyId: "key-id", EncodedApiKey: "encoded-key" },
            Basic: { Username: "admin", Password: "secret" },
            Certificate: { CertificatesBase64: ["MIIC..."] },
          },
        },
      },
    });
    const auth = get(result, "ElasticSearchConnectionStrings.MyEs.Authentication") as Record<string, unknown>;
    // ApiKey property name itself is sensitive — entire object becomes null
    expect(auth["ApiKey"]).toBeNull();
    expect(get(auth, "Basic.Password")).toBeNull();
    expect(get(auth, "Certificate.CertificatesBase64")).toBeNull();
  });

  it("redacts Snowflake connection strings", () => {
    const result = redact({
      SnowflakeConnectionStrings: {
        MySf: {
          Name: "MySf",
          ConnectionString: "account=xy12345;user=admin;password=secret;",
        },
      },
    });
    expect(get(result, "SnowflakeConnectionStrings.MySf.ConnectionString")).toBeNull();
  });

  it("redacts AI connection string API keys", () => {
    const result = redact({
      AiConnectionStrings: {
        MyAi: { Name: "MyAi", ApiKey: "sk-abc123", Endpoint: "https://api.openai.com" },
      },
    });
    const ai = get(result, "AiConnectionStrings.MyAi") as Record<string, unknown>;
    expect(ai["Name"]).toBe("MyAi");
    expect(ai["Endpoint"]).toBe("https://api.openai.com");
    expect(ai["ApiKey"]).toBeNull();
  });

  it("redacts queue connection string credentials", () => {
    const result = redact({
      QueueConnectionStrings: {
        MyRabbit: {
          Name: "MyRabbit",
          RabbitMqConnectionSettings: { ConnectionString: "amqp://user:pass@host:5672/vhost" },
        },
        MyAzureQueue: {
          Name: "MyAzureQueue",
          AzureQueueStorageConnectionSettings: {
            ConnectionString: "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...",
            EntraId: { TenantId: "tenant", ClientId: "client", ClientSecret: "secret" },
          },
        },
      },
    });
    expect(get(result, "QueueConnectionStrings.MyRabbit.RabbitMqConnectionSettings.ConnectionString")).toBeNull();
    expect(get(result, "QueueConnectionStrings.MyAzureQueue.AzureQueueStorageConnectionSettings.ConnectionString")).toBeNull();
    expect(get(result, "QueueConnectionStrings.MyAzureQueue.AzureQueueStorageConnectionSettings.EntraId.ClientSecret")).toBeNull();
  });

  it("preserves non-sensitive data", () => {
    const result = redact({
      DatabaseName: "testdb",
      Disabled: false,
      Encrypted: true,
      Topology: { Members: ["A", "B"], ReplicationFactor: 2 },
      Indexes: {},
      Etag: 1234,
    });
    expect(result["DatabaseName"]).toBe("testdb");
    expect(result["Disabled"]).toBe(false);
    expect(result["Encrypted"]).toBe(true);
    expect(result["Etag"]).toBe(1234);
    expect(get(result, "Topology.ReplicationFactor")).toBe(2);
  });
});
