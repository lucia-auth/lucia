import m from "mongoose";
import { MONGO_URI } from "$env/static/private";

console.log(MONGO_URI)

m.model(
    "user",
    new m.Schema(
        {
            _id: {
                type: String
            },
            provider_id: {
                type: String,
                unique: true,
                required: true
            },
            hashed_password: String
        },
        { _id: false }
    )
);

m.model(
    "session",
    new m.Schema(
        {
            _id: {
                type: String
            },
            user_id: {
                type: String,
                required: true
            },
            expires: {
                type: Number,
                required: true
            },
            idle_expires: {
                type: Number,
                required: true
               }
        },
        { _id: false }
    )
);

m.connect(MONGO_URI ?? "");