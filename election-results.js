class Precinct {

    constructor(number, electionResults) {
        this.number = number;
        this.parent = electionResults;
        const votes = {};
        for (const [contest, votesByCandidate] of Object.entries(this.parent.votes)) {
            votes[contest] = {};
            for (const [candidate, votesByPrecinct] of Object.entries(votesByCandidate)) {
                votes[contest][candidate] = votesByPrecinct[number];
            }
        }
        this.votes = votes;
        this.ward = this.parent.getWardForPrecinct(number);
    }

    getVotes(candidate = null) {
        const contest = this.parent.currentContest;
        if (!contest) {
            throw new Error('Contest must be set before getting votes');
        }
        if (!candidate) {
            return this.votes[contest];
        }
        if (!this.votes[contest].hasOwnProperty(candidate)) {
            throw new Error(`No candidate "${candidate}" in contest "${contest}"`);
        }
        return this.votes[contest][candidate];
    }

    getTotal() {
        if (this.total === undefined) {
            const contestVotes = this.getVotes();
            this.total = Object.values(contestVotes).reduce((a, b) => a + b);
        }
        return this.total;
    }

    getPercent(candidate = null) {
        const total = this.getTotal();
        if (candidate) {
            return 100 * this.getVotes(candidate) / total;
        }
        const percents = {};
        for (const [candidate, votes] of Object.entries(this.getVotes())) {
            percents[candidate] = 100 * votes / total;
        }
        return percents;
    }

    getCandidates() {
        if (this.candidates === undefined) {
            this.candidates = Object.keys(this.getVotes());
        }
        return this.candidates;
    }

    getWinner() {
        if (this.winner === undefined) {
            const contestVotes = this.getVotes();
            let max = -1;
            for (const [candidate, votes] of Object.entries(contestVotes)) {
                if (votes > max) {
                    this.winner = candidate;
                    max = votes;
                }
            }
        }
        return this.winner;
    }

    getSecondPlace() {
        if (this.total === undefined) {
            const contestVotes = this.getVotes();
            this.secondPlace = this.getCandidates()
                .sort((c1, c2) => contestVotes[c2] - contestVotes[c1])[1];
        }
        return this.secondPlace;
    }

    reset() {
        delete this.winner;
        delete this.secondPlace;
        delete this.candidates;
        delete this.total;
    }

}

class ElectionResults {

    constructor(votes, precinctToWard) {
        this.votes = votes;
        this.precinctToWard = precinctToWard;
        this.currentContest = null;
        this.currentCandidate = null;
    }

    getPrecinct(number) {
        return new Precinct(number, this);
    }

    getWardForPrecinct(number) {
        return this.precinctToWard[number];
    }

    setCurrentContest(contest) {
        if (!this.votes.hasOwnProperty(contest)) {
            throw new Error(`Unknown contest "${contest}"`);
        }
        this.currentContest = contest;
        return this;
    }

    setCurrentCandidate(candidate) {
        const contest = this.currentContest;
        if (!contest) {
            throw new Error('Contest must be set before candidate');
        }
        if (!this.votes[contest].hasOwnProperty(candidate)) {
            throw new Error(`No candidate "${candidate}" in contest "${contest}"`);
        }
        this.currentCandidate = candidate;
        return this;
    }

    getVotes(candidate = null) {
        const contest = this.currentContest;
        if (!contest) {
            throw new Error('Contest must be set before getting votes');
        }
        if (!candidate) {
            return this.votes[contest];
        }
        if (!this.votes[contest].hasOwnProperty(candidate)) {
            throw new Error(`No candidate "${candidate}" in contest "${contest}"`);
        }
        return this.votes[contest][candidate];
    }

    getCandidates() {
        return Object.keys(this.getVotes());
    }

}

if (module && module.exports) {
    module.exports = ElectionResults;
}
