import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as appsync from "@aws-cdk/aws-appsync";

export class CdkappsyncDynamoIncrementStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const PREFIX_NAME = id.toLowerCase().replace('stack', '')

    // appsync api

    const api = new appsync.GraphqlApi(this, "api", {
      name: PREFIX_NAME + "-api",
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
      schema: new appsync.Schema({
        filePath: "graphql/schema.graphql",
      }),
    })

    // Dynamo Table and register as resolver

    const table = new dynamodb.Table(this, "table", {
      tableName: PREFIX_NAME + "-table",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const dynamo_datasource = api.addDynamoDbDataSource(
      "dynamo_datasource",
      table
    )

    dynamo_datasource.createResolver({
      typeName: "Query",
      fieldName: "listProducts",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    })

    dynamo_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "addProduct",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        "mapping_template/add_product.vtl"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })
    
    dynamo_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "updateProduct",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        "mapping_template/update_product.vtl"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    })
    
  }
}
