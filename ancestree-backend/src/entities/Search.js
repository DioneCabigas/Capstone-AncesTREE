class Search {
    constructor() {
        this.user = '';
        this.results = [];
        this.city = '';
        this.country = '';
    }

    setUser(user) {
        this.user = user;
    }

    getUser() {
        return this.user;
    }

    setResults(results) {
        this.results = results;
    }

    getResults() {
        return this.results;
    }

    setCity(city) {
        this.city = city;
    }

    getCity() {
        return this.city;
    }

    setCountry(country) {
        this.country = country;
    }

    getCountry() {
        return this.country;
    }

    toJSON() {
        return {
            user: this.user,
            results: this.results,
            city: this.city,
            country: this.country
        };
    }
}

module.exports = Search;