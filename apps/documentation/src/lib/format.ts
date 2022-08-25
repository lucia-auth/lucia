const dictionary = {
    "apis": "APIs",
    "oauth": "OAuth",
    "mongodb": "MongoDB",
    "appwrite": "AppWrite",
    "couchdb": "couchDB"
}


export const formatText = (string: string) => {
    let words = string.split(" ")
    Object.entries(dictionary).forEach(([key, value]) => {
        words = words.map((word) => {
            if (word === key) return value
            return word
        })
    })
    let newString = words.join(" ")
    const result =  newString.charAt(0).toUpperCase() + newString.slice(1);
    return result
}

