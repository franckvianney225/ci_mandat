"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSource = exports.typeOrmConfig = void 0;
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const configService = new config_1.ConfigService();
exports.typeOrmConfig = {
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
    extra: {
        ssl: configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
    },
    maxQueryExecutionTime: 1000,
    poolSize: 20,
    connectTimeoutMS: 10000,
    applicationName: 'ci-mandat-backend',
    cache: {
        type: 'database',
        tableName: 'typeorm_query_cache',
        duration: 30000,
    },
};
exports.dataSource = new typeorm_1.DataSource({
    ...exports.typeOrmConfig,
    type: 'postgres',
    migrationsTableName: 'migrations',
});
exports.default = exports.typeOrmConfig;
//# sourceMappingURL=database.config.js.map