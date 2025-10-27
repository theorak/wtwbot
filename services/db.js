import { SQL } from "bun";

export function createConnection(config) {
    const connStr = `mysql://${config.dbusername}:${config.dbpassword}@${config.dbhostname}:${config.dbport || 3306}/${config.dbdatabase}`;
    const db = new SQL(connStr);
    global.log.write(`[DB] MySQL connection established (${config.dbhostname}:${config.dbport})`);
    return db;
}

export async function testConnection(db, config) {
    try {
        await db`SELECT 1`;
        global.log.success('[DB] Connection test successful!');
    } catch (err) {
        if (err.message.includes("Unknown database")) {
            global.log.error(`[DB] Database '${config.dbdatabase}' does not exist. Please create it and restart the bot.`);
            process.exit(1);
        } else if (
            err.message.toLowerCase().includes('access denied') ||
            err.message.toLowerCase().includes('permission')
        ) {
            global.log.error("[DB] MySQL user does not have the required permissions.");
            process.exit(1);
        } else {
            global.log.error('[DB] Connection test failed:', err);
            process.exit(1);
        }
    }
}
