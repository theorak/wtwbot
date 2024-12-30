module.exports.write = (table, value, con) => {
  var sql =`INSERT INTO ${table} VALUES ${value};`;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("SQL-WRITE SUCCESS!");
		return;
	});
}

module.exports.read = (column, table, con, cb) => {
  let query = `SELECT ${column} FROM ${table}`;

  con.query(query, function(err, results) {
    if (err) {
      throw err;
    }
    cb(results);
  });
}

module.exports.statistik = (con, cb) => {
	let query = `SELECT author, count(*) as anzahl FROM zitate GROUP BY author`;
  
	con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }

module.exports.where = (column, table, term, value, con, cb) => {
	let query = `SELECT ${column} FROM ${table} WHERE ${term} = ${value}`;

	con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }

module.exports.whereEx = (column, table, term, equal, value, con, cb) => {
	let query = `SELECT ${column} FROM ${table} WHERE ${term} ${equal} ${value}`;

	con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }

module.exports.delete = (table, column, condition, con) => {
  var sql = `DELETE FROM ${table} WHERE ${column}=${condition} LIMIT 1`;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("SQL-DELETE SUCCESS!");
		return;
	});
}

module.exports.deleteAll = (table, con) => {
  var sql = `DELETE FROM ${table}`;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("SQL-DELETE SUCCESS!");
		return;
	});
}

module.exports.update = (table, condition, where, con) => {
  var sql = `UPDATE ${table} SET ${condition} WHERE ${where}`;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("SQL-UPDATE SUCCESS!");
		return;
	});
}

module.exports.updateAll = (table, condition, con) => {
  var sql = `UPDATE ${table} SET ${condition}`;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("SQL-UPDATE SUCCESS!");
		return;
	});
}

module.exports.readLimit = (column, table, order, limit, con, cb) => {
  let query = `SELECT ${column} FROM ${table} ORDER BY ${order} DESC LIMIT ${limit}`;

  con.query(query, function(err, results) {
    if (err) {
      throw err;
    }
    cb(results);
  });
}

module.exports.innerSelect = (column, table, innerjoin, table1, table2, con, cb) => {
	let query = `SELECT ${column} FROM ${table} INNER JOIN ${innerjoin} ON ${table1}=${table2}`;

	con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }

  module.exports.innerWhereEx = (column, table, innerjoin, table1, table2, term, equal, term2, con, cb) => {
	let query = `SELECT ${column} FROM ${table} INNER JOIN ${innerjoin} ON ${table1}=${table2} WHERE ${term} ${equal} ${term2}`;

	con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }

  module.exports.innerSelectWhere = async (column, table, innerjoin, table1, table2, qual1, qual2, con, cb) => {
	let query = `SELECT ${column} FROM ${table} INNER JOIN ${innerjoin} ON ${table1}=${table2} WHERE ${qual1}=${qual2}`;

	await con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }
 
  module.exports.custom = async (value, con, cb) => {
	let query = `${value}`;

	await con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  cb(results);
	});
  }

  module.exports.customNB = async (value, con) => {
	let query = `${value}`;

	await con.query(query, function(err, results) {
	  if (err) {
		throw err;
	  }
	  return;
	});
  }