import mongoose, {HydratedDocument} from "mongoose";
import {UserDocument, UserFields} from "../types";
import argon2 from "argon2";
import jwt from 'jsonwebtoken';

interface UserMethods {
    checkPassword: (password: string) => Promise<boolean>;
    generateToken(): void;
}

const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 5,
    parallelism: 1,
};

export const JWT_SECRET = process.env.JWT_SECRET || 'default_fallback_secret';

type UserModel = mongoose.Model<UserDocument, {}, UserMethods>;

const UserSchema = new mongoose.Schema<
    UserDocument,
    UserModel,
    UserMethods,
    {}
>({
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function(value: string): Promise<boolean> {
                if (!this.isModified('username')) return true;
                const user: HydratedDocument<UserFields> | null = await User.findOne({username: value});
                return !user;
            },
            message: "This is username is already taken"
        }
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
});

UserSchema.methods.checkPassword = async function (password: string){
    return await argon2.verify(this.password, password);
}

UserSchema.methods.generateToken = function (){
    this.token = jwt.sign({_id: this._id}, JWT_SECRET, { expiresIn: "365d" });
}

UserSchema.pre('save', async function (next){
    if (!this.isModified("password")) return next();

    this.password = await argon2.hash(this.password, ARGON2_OPTIONS);
    next();
});

UserSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password;
        return ret;
    }
})

const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);
export default User;