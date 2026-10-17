const databaseName = "SI_DBProductManagement";
const queryUsername = "discount-pricing-query";
const queryPassword = "discount-pricing-query-password";
const maintenanceUsername = "discount-pricing-maintenance";
const maintenancePassword = "discount-pricing-maintenance-password";
const pricingDatabase = db.getSiblingDB(databaseName);
const administrationDatabase = db.getSiblingDB("admin");

const queryCollections = [
    "ConfiguredPricingAmountRanges",
    "ConfiguredPricingTermRanges",
    "ConfiguredPricingDimensionGroups",
    "ConfiguredPricingRates",
    "CatalogRateTypes",
    "ConfiguredPricingSchemas"
];

const maintenanceReadCollections = [
    ...queryCollections,
    "ConfiguredPricingVersions",
    "CatalogProducts",
    "CatalogBranches",
    "CatalogInternalRatings",
    "ConfiguredPricingAudit"
];

const maintenanceWriteCollections = [
    "ConfiguredPricingSchemas",
    "ConfiguredPricingVersions",
    "ConfiguredPricingAmountRanges",
    "ConfiguredPricingTermRanges",
    "ConfiguredPricingDimensionGroups",
    "ConfiguredPricingRates",
    "ConfiguredPricingAudit"
];

const collectionPrivilege = (collection, actions) => ({
    resource: { db: databaseName, collection },
    actions
});

const queryRole = "discountPricingQueryRole";
const maintenanceRole = "discountPricingMaintenanceRole";

const queryPrivileges = queryCollections.map((collection) =>
    collectionPrivilege(collection, ["find"]));

const maintenancePrivileges = [
    ...maintenanceReadCollections.map((collection) => collectionPrivilege(collection, ["find"])),
    ...maintenanceWriteCollections.map((collection) =>
        collectionPrivilege(collection, ["insert", "update", "remove"]))
];

const upsertRole = (role, privileges) => {
    const definition = { privileges, roles: [] };

    if (pricingDatabase.getRole(role)) {
        pricingDatabase.updateRole(role, definition);
        return;
    }

    pricingDatabase.createRole({ role, ...definition });
};

const upsertUser = (user, password, role) => {
    const definition = {
        pwd: password,
        roles: [{ role, db: databaseName }]
    };

    if (administrationDatabase.getUser(user)) {
        administrationDatabase.updateUser(user, definition);
        return;
    }

    administrationDatabase.createUser({ user, ...definition });
};

upsertRole(queryRole, queryPrivileges);
upsertRole(maintenanceRole, maintenancePrivileges);
upsertUser(queryUsername, queryPassword, queryRole);
upsertUser(maintenanceUsername, maintenancePassword, maintenanceRole);

print(`MongoDB roles and users configured for ${databaseName}.`);
