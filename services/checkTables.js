import { SQL } from "bun";

export async function checkOrCreateTables(db, config) {
  // Parties Tabelle
  const parties = await db`SHOW TABLES LIKE 'parties';`;
  if (parties.length === 0) {
    global.log.warn('[DB] "parties" table does not exist. Creating...');
    await db`
      CREATE TABLE parties (
        partyid INT(11) NOT NULL AUTO_INCREMENT,
        name TEXT NOT NULL COLLATE 'utf8mb4_general_ci',
        PRIMARY KEY (partyid) USING BTREE
      )
    `;
    global.log.success('[DB] parties table created!');
  } else {
    global.log.info('[DB] "parties" table exists.');
  }

  // Player Tabelle
  const players = await db`SHOW TABLES LIKE 'player';`;
  if (players.length === 0) {
    global.log.warn('[DB] "player" table does not exist. Creating...');
    await db`
      CREATE TABLE player (
        discordid BIGINT(20) NOT NULL PRIMARY KEY,
        name TEXT NOT NULL COLLATE 'utf8mb4_general_ci'
      )
    `;
    global.log.success('[DB] player table created!');
  } else {
    global.log.info('[DB] "player" table exists.');
  }

  // Leader Tabelle
  const leaders = await db`SHOW TABLES LIKE 'leader';`;
  if (leaders.length === 0) {
    global.log.warn('[DB] "leader" table does not exist. Creating...');
    await db`
      CREATE TABLE leader (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        leader_name TEXT NOT NULL COLLATE 'utf8mb4_general_ci',
        faction TEXT NOT NULL COLLATE 'utf8mb4_general_ci',
        banner TEXT NOT NULL COLLATE 'utf8mb4_general_ci'
      )
    `;
    global.log.success('[DB] leader table created!');
  } else {
    global.log.info('[DB] "leader" table exists.');
  }

  // Kombinationstabelle
  const ppl = await db`SHOW TABLES LIKE 'player_party_leader';`;
  if (ppl.length === 0) {
    global.log.warn('[DB] "player_party_leader" table does not exist. Creating...');
    await db`
      CREATE TABLE player_party_leader (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        player_discordid BIGINT(20) NOT NULL,
        partyid INT(11) NOT NULL,
        leader_id INT(11) NOT NULL,
        FOREIGN KEY (player_discordid) REFERENCES player(discordid) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (partyid) REFERENCES parties(partyid) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (leader_id) REFERENCES leader(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY unique_player_party (player_discordid, partyid)
      )
    `;
    global.log.success('[DB] player_party_leader table created!');
  } else {
    global.log.info('[DB] "player_party_leader" table exists.');
  }
}
