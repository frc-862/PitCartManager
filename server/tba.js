const axios = require('axios');

function quickState() {

}

async function getMatches(team, event, auth, comp_level = ["qm"]) {
    var data = (await axios.get('https://www.thebluealliance.com/api/v3/team/frc' + team + '/event/' + event + '/matches/simple', {
        headers: {
            'X-TBA-Auth-Key': auth
        }
    })).data;
    var allMatches = [];
    data.filter(m => comp_level.includes(m.comp_level)).forEach(match => {
        var m = {
            results: {
                finished: match.winning_alliance != null,
                red: match.alliances.red.score,
                blue: match.alliances.blue.score
            },
            winner: match.winning_alliance,
            competition: match.event_key,
            matchNumber: match.match_number,
            teams: {
                red: match.alliances.red.team_keys.map(team => parseInt(team.substring(3))),
                blue: match.alliances.blue.team_keys.map(team => parseInt(team.substring(3)))
            },
            locked: false,
            documents: [],
            description: match.comp_level + match.match_number,
            matchType: "Qualification",
            playoffNum: match.comp_level == "sf" ? match.set_number + 900 : match.match_number,
            rawType: match.comp_level
        }
        allMatches.push(m);
    });
    return allMatches;
}

async function getAllPlayoffs(event, auth) {
    var data = (await axios.get('https://www.thebluealliance.com/api/v3/event/' + event + '/matches/simple', {
        headers: {
            'X-TBA-Auth-Key': auth
        }
    })).data.filter(m => m.comp_level != "qm");
    var allMatches = [];
    data.forEach(match => {
        var m = {
            results: {
                finished: match.winning_alliance != null,
                red: match.alliances.red.score,
                blue: match.alliances.blue.score
            },
            winner: match.winning_alliance,
            competition: match.event_key,
            matchNumber: match.comp_level == "sf" ? match.set_number + 900 : match.match_number + 913,
            teams: {
                red: match.alliances.red.team_keys.map(team => parseInt(team.substring(3))),
                blue: match.alliances.blue.team_keys.map(team => parseInt(team.substring(3)))
            },
            locked: false,
            documents: [],
            description: match.comp_level + match.match_number,
            matchType: "Playoff"
        }
        allMatches.push(m);
    });
    return allMatches;
}

module.exports = { getMatches, getAllPlayoffs, quickState };