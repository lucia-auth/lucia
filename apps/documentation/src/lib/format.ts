const dictionary = {
    "apis": "APIs",
    "oauth": "OAuth"
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

