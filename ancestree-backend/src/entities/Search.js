class Search {
    constructor() {
        this.searchTerm = '';
        this.results = [];
        this.city = '';
        this.country = '';
    }
    
    setSearchTerm(term) {
        this.searchTerm = term;
    }
    
    getSearchTerm() {
        return this.searchTerm;
    }
    
    setResults(results) {
        this.results = results;
    }
    
    getResults() {
        return this.results;
    }
}