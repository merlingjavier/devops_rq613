const databaseName = "SI_DBApibusEventHistory";
const collectionName = "MicroserviceCallTrace";
const username = "product-pricing-trace-writer";
const password = "product-pricing-trace-writer-password";
const roleName = "productPricingTraceWriterRole";
const administrationDatabase = db.getSiblingDB("admin");

const roleDefinition = {
    privileges: [
        {
            resource: { db: databaseName, collection: collectionName },
            actions: ["insert", "update"]
        }
    ],
    roles: []
};

if (administrationDatabase.getRole(roleName)) {
    administrationDatabase.updateRole(roleName, roleDefinition);
} else {
    administrationDatabase.createRole({ role: roleName, ...roleDefinition });
}

const userDefinition = {
    pwd: password,
    roles: [{ role: roleName, db: "admin" }]
};

if (administrationDatabase.getUser(username)) {
    administrationDatabase.updateUser(username, userDefinition);
} else {
    administrationDatabase.createUser({ user: username, ...userDefinition });
}

print(`MongoDB trace user configured for ${databaseName}.${collectionName} with admin authSource.`);
