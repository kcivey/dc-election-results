class ElectionResults {

    constructor(votes, precinctToWard) {
        this.votes = votes;
        this.precinctToWard = precinctToWard;
        this.currentContest = null;
        this.currentCandidate = null;
    }

    getPrecinct(number) {
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

}

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
        const contestVotes = this.getVotes();
        return Object.values(contestVotes).reduce((a, b) => a + b);
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
        return Object.keys(this.getVotes());
    }

    getWinner() {
        const contestVotes = this.getVotes();
        let winner;
        let max = -1;
        for (const [candidate, votes] of contestVotes) {
            if (votes > max) {
                winner = candidate;
                max = votes;
            }
        }
        return winner;
    }

}
