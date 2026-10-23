const databaseName = "SI_DBProductManagement";
// const queryUsername = "discount-pricing-query";
// const queryPassword = "discount-pricing-query-password";
// const maintenanceUsername = "discount-pricing-maintenance";
// const maintenancePassword = "discount-pricing-maintenance-password";
const queryUsername = "BMLm4RnHdl0icZec0R6R4bz0E5gMkbiAxzmXGM8B1S2L4r7iVOnh7yga3nZqwyb9pD9zAB2Frn1NG6eSxF/Fg7p+el21DuwqFeqR5f8rklsj7dKb5Nz/OQo641d1Qagb";
const queryPassword = "BMLm4RnHdl0icZec0R6R4f/dpd1GqCnnCFc2UZ1CN4qjkar2VcqTRURtob4z41NDLdxsMI/PrCxUS38FG1mQp9bBP2GiZBjBllFZ/MMskbQkIHxRAb8CbMQZbogouIkq";
const maintenanceUsername = "BMLm4RnHdl0icZec0R6R4dAazIcL6rXiqv6d5ub9JK/SUPF6rrfhXsTJHFIFBFjtSZlrxBVM2zbmauuWpu0tO2zH2pV9mwhpcDx3wPKHrM8fJVPOXLho4Him1seyb/rF";
const maintenancePassword = "BMLm4RnHdl0icZec0R6R4VYN9/bFfokzaN34aDCQSQLJdlWYAOck0wxgks73wrupXDd3agvgCQ3cdBVBRYiW9msLK0KVI1wkBJl25yNbBRAG5sB4RP3f7fREjUn6rhyi";
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
