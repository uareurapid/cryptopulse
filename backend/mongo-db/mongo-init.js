db.getSiblingDB(process.env.MONGO_DB)

db.createUser(
    {
        user: process.env.MONGO_USER,
        pwd: process.env.MONGO_PASSWORD,
        roles: [
            {
                role: "readWrite",
                db: process.env.MONGO_DB
            }
        ]
    }
);

db.createCollection("users");
db.createCollection("supported-chains");
db.createCollection("wallet-tracking");
db.createCollection("token-tracking");
db.createCollection("wallet-transfers");
db.createCollection("token-transfers");