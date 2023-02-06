import bcryptjs from 'bcryptjs'
import { Secret, sign } from 'jsonwebtoken'
import { Model } from 'objection'

export class User extends Model {
  static tableName = 'users'

  id!: number
  email!: string
  password!: string
  username!: string

  async $beforeInsert() {
    // hash the password before saving the user
    this.password = await bcryptjs.hash(this.password, 10)
  }

  generateJWT() {
    // sign and return a JWT
    return sign({ id: this.id }, process.env.JWT_SECRET as Secret, {
      expiresIn: '7d'
    })
  }

  generateRefreshToken() {
    // generate a refresh token
    return sign({ id: this.id }, process.env.JWT_SECRET as Secret, {
      expiresIn: '7d'
    })
  }

  async verifyPassword(password: string) {
    // compare the given password with the hashed password in the db
    return bcryptjs.compare(password, this.password)
  }

  // static get relationMappings() {
  //   const RefreshToken = require("./refresh-token").RefreshToken;
  //   return {
  //     refreshTokens: {
  //       relation: Model.HasManyRelation,
  //       modelClass: RefreshToken,
  //       join: {
  //         from: "users.id",
  //         to: "refresh-tokens.userId"
  //       }
  //     }
  //   };
  // }
}
