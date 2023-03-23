// backend
import {test} from "tape";
import {createIdDirective} from './index.js'
import { makeExecutableSchema } from "@graphql-tools/schema"
import { printSchemaWithDirectives } from "@graphql-tools/utils"
import {graphqlSync} from 'graphql'

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
 
      type Person @id(from: ["personID", "name"]) {
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

type Person @id(from: ["personID", "name"]) {
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

  const res = graphqlSync({
    schema,
    source: `
      {
        people {
          id
        }
        locations {
          uid
        }
      }
    `
  }).data

  t.isEqual(res.people[0].id, 'Person:1Ben')
  t.deepEquals(res.locations[0].uid, 'Location:1')

  t.end()
})
