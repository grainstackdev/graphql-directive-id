import {GraphQLID, GraphQLObjectType} from "graphql";
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'

export function createIdDirective(directiveName = 'id') {
  return {
    idDirectiveTransformer: schema =>
      mapSchema(schema, {
        [MapperKind.OBJECT_TYPE]: type => {
          const idDirective = getDirective(schema, type, directiveName)?.[0]
          if (idDirective) {
            const {name, from} = idDirective
            const config = type.toConfig()
            config.fields[name || 'id'] = {
              type: GraphQLID,
              description: 'Unique ID',
              args: {},
              resolve(object) {
                let sum = type.name + ":"
                for (const fieldName of from) {
                  const fromValue = String(object[fieldName])
                  sum += fromValue
                }
                return sum
              }
            }
            return new GraphQLObjectType(config)
          }
        }
      }),
    idDirectiveTypeDefs: `directive @${directiveName}(name: String, from: [String]) on OBJECT`
  }
}
