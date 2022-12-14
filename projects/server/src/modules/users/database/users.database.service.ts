import {DatabaseService} from "../../../services/database/database.service";
import {PostgresError, Row, RowList} from "postgres";
import {PG_UNIQUE_VIOLATION} from "../../../services/database/database-error-codes";
import {InternalDatabaseUserDto, DatabaseUserDto, CreateDatabaseUserDto, UpdateDatabaseUserDto} from "@ben-ryder/lfb-common";
import {ErrorIdentifiers} from "@ben-ryder/lfb-common";
import {Injectable} from "@nestjs/common";
import {ResourceRelationshipError} from "../../../services/errors/resource/resource-relationship.error";
import {SystemError} from "../../../services/errors/base/system.error";
import {ResourceNotFoundError} from "../../../services/errors/resource/resource-not-found.error";


@Injectable()
export class UsersDatabaseService {
  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  private static mapApplicationField(fieldName: string): string {
    switch (fieldName) {
      case "passwordHash":
        return "password_hash";
      case "encryptionSecret":
        return "encryption_secret";
      case "is_verified":
        return "isVerified"
      case "created_at":
        return "createdAt";
      case "updated_at":
        return "updatedAt";
      default:
        return fieldName;
    }
  }

  private static convertDatabaseDtoToDto(user: InternalDatabaseUserDto): DatabaseUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash,
      encryptionSecret: user.encryption_secret,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  }

  private static getDatabaseError(e: any) {
    if (e instanceof PostgresError) {
      if (e.code && e.code === PG_UNIQUE_VIOLATION) {
        if (e.constraint_name === "users_username_key") {
          return new ResourceRelationshipError({
            identifier: ErrorIdentifiers.USER_USERNAME_EXISTS,
            applicationMessage: "The supplied username is already taken by another user."
          })
        }
        else if (e.constraint_name == "users_email_key") {
          return new ResourceRelationshipError({
            identifier: ErrorIdentifiers.USER_EMAIL_EXISTS,
            applicationMessage: "The supplied email address is already taken by another user."
          })
        }
      }
    }

    return new SystemError({
      message: "Unexpected error while creating user",
      originalError: e
    })
  }

  async get(userId: string): Promise<DatabaseUserDto> {
    const sql = await this.databaseService.getSQL();

    let result: InternalDatabaseUserDto[] = [];
    try {
      result = await sql<InternalDatabaseUserDto[]>`SELECT * FROM users WHERE id = ${userId}`;
    }
    catch (e: any) {
      throw UsersDatabaseService.getDatabaseError(e);
    }

    if (result.length > 0) {
      return UsersDatabaseService.convertDatabaseDtoToDto(result[0]);
    }
    else {
      throw new ResourceNotFoundError({
        identifier: ErrorIdentifiers.USER_NOT_FOUND,
        applicationMessage: "The requested user could not be found."
      })
    }
  }

  async getByUsername(username: string): Promise<DatabaseUserDto> {
    const sql = await this.databaseService.getSQL();

    let result: InternalDatabaseUserDto[] = [];
    try {
      result = await sql<InternalDatabaseUserDto[]>`SELECT * FROM users WHERE username = ${username}`;
    }
    catch (e: any) {
      throw UsersDatabaseService.getDatabaseError(e);
    }

    if (result.length > 0) {
      return UsersDatabaseService.convertDatabaseDtoToDto(result[0]);
    }
    else {
      throw new ResourceNotFoundError({
        identifier: ErrorIdentifiers.USER_NOT_FOUND,
        applicationMessage: "The requested user could not be found."
      })
    }
  }

  async create(user: CreateDatabaseUserDto): Promise<DatabaseUserDto> {
    const sql = await this.databaseService.getSQL();

    let result: InternalDatabaseUserDto[] = [];
    try {
      result = await sql<InternalDatabaseUserDto[]>`
        INSERT INTO users(id, username, email, password_hash, encryption_secret, is_verified, created_at, updated_at) 
        VALUES (DEFAULT, ${user.username}, ${user.email}, ${user.passwordHash}, ${user.encryptionSecret}, DEFAULT, DEFAULT, DEFAULT)
        RETURNING *;
       `;
    }
    catch (e: any) {
      throw UsersDatabaseService.getDatabaseError(e);
    }

    if (result.length > 0) {
      return UsersDatabaseService.convertDatabaseDtoToDto(result[0]);
    }
    else {
      throw new SystemError({
        message: "Unexpected error returning user after creation",
      })
    }
  }

  async update(userId: string, updatedUser: UpdateDatabaseUserDto): Promise<DatabaseUserDto> {
    const sql = await this.databaseService.getSQL();

    // If there are no supplied fields to update, then just return the existing user.
    if (Object.keys(updatedUser).length === 0) {
      return this.get(userId);
    }

    // Process all fields
    // todo: this offers no protection against updating fields like id which should never be updated
    const updateObject: any = {};
    for (const fieldName of Object.keys(updatedUser) as Array<keyof UpdateDatabaseUserDto>) {
      updateObject[UsersDatabaseService.mapApplicationField(fieldName)] = updatedUser[fieldName];
    }

    let result: InternalDatabaseUserDto[] = [];
    try {
      result = await sql<InternalDatabaseUserDto[]>`
        UPDATE users
        SET ${sql(updateObject, ...Object.keys(updateObject))}
        WHERE id = ${userId}
        RETURNING *;
      `;
    }
    catch (e: any) {
      throw UsersDatabaseService.getDatabaseError(e);
    }

    if (result.length > 0) {
      return UsersDatabaseService.convertDatabaseDtoToDto(result[0]);
    }
    else {
      throw new SystemError({
        message: "Unexpected error returning user after creation",
      })
    }
  }

  async delete(userId: string): Promise<void> {
    const sql = await this.databaseService.getSQL();

    let result: RowList<Row[]>;
    try {
      result = await sql`DELETE FROM users WHERE id = ${userId}`;
    }
    catch (e: any) {
      throw UsersDatabaseService.getDatabaseError(e);
    }

    // If there's a count then rows were affected and the deletion was a success
    // If there's no count but an error wasn't thrown then the entity must not exist
    if (result && result.count) {
      return;
    }
    else {
      throw new ResourceNotFoundError({
        applicationMessage: "The requested user could not be found."
      })
    }
  }
}
