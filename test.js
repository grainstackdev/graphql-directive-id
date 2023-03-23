// backend
import {test} from "tape";
import {createIdDirective} from './index.js'
import { makeExecutableSchema  } from "@graphql-tools/schema"
import { printSchemaWithDirectives } from "@graphql-tools/utils"

const {idDirectiveTransformer, idDirectiveTypeDefs} = createIdDirective('id')

test('generation', (t) => {
  let schema = makeExecutableSchema({
    typeDefs: [
      idDirectiveTypeDefs,
      `
      type Query {
        people: [Person]
        locations: [Location]
      }
 
      type Person @id(from: ["personID"]) {
        personID: Int
        name: String
      }
 
      type Location @id(name: "uid", from: ["locationID"]) {
        locationID: Int
        address: String
      }
    `
    ],
    resolvers: {
      Query: {
        people: () => [
          {
            personID: 1,
            name: 'Ben'
          }
        ],
        locations: () => [
          {
            locationID: 1,
            address: '104 10th St'
          }
        ]
      }
    }
  })
  schema = idDirectiveTransformer(schema)

  const out = printSchemaWithDirectives(schema)

  t.isEqual(out, `schema {
  query: Query
}

directive @id(name: String, from: [String]) on OBJECT

type Query {
  people: [Person]
  locations: [Location]
}

type Person @id(from: ["personID"]) {
  personID: Int
  name: String
  """Unique ID"""
  id: ID
}

type Location @id(name: "uid", from: ["locationID"]) {
  locationID: Int
  address: String
  """Unique ID"""
  uid: ID
}`)

  t.end()
})
