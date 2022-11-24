import * as dotenv from "dotenv";
import { Injectable } from "@nestjs/common";
dotenv.config();

/**
 * The interface that the configuration object (and ConfigService instance attribute ".config") adhere to.
 */
export interface ConfigInterface {
  general: {
    port: number;
    environment: string;
    corsOrigins: string[]
  };
  app: {
    registrationEnabled: boolean;
  };
  database: {
    url: string;
  };
  auth: {
    accessToken: {
      secret: string;
      expiry: string;
    };
    refreshToken: {
      secret: string;
      expiry: string;
    };
    passwordReset: {
      secret: string;
      expiry: string;
    };
  };
}

/**
 * The raw configuration data.
 *
 * This is created separately to ConfigService, so it can be used in other places such as easily creating a
 * custom config service for testing.
 */
export const config: ConfigInterface = Object.freeze({
  general: {
    port: parseInt(process.env.NODE_PORT as string) || 3000,
    environment: process.env.NODE_ENV || "production",
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []
  },
  app: {
    registrationEnabled: process.env.APP_REGISTRATION_ENABLED === "true",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    accessToken: {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiry: process.env.ACCESS_TOKEN_EXPIRY,
    },
    refreshToken: {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiry: process.env.REFRESH_TOKEN_EXPIRY,
    },
    passwordReset: {
      secret: process.env.PASSWORD_RESET_TOKEN_SECRET,
      expiry: process.env.PASSWORD_RESET_TOKEN_EXPIRY,
    },
  }
} as ConfigInterface);

/**
 * An injectable class version of the configuration.
 */
@Injectable()
export class ConfigService {
  readonly config: ConfigInterface = config;
}
