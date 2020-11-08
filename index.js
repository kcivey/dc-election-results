/**
 * Copyright 2019 Keith C. Ivey
 * keith@iveys.org
 * https://dcgeekery.com
 * ISC License
 * Source: https://github/kcivey/dc-election-results-js
 */
/* globals jQuery, L */
const ElectionResults = require('./election-results');
const Choropleth = require('choropleth-js');
jQuery(function () {
    let votes;
    let precinctToWard;
    fetch('20200602P.json')
        .then(response => response.json())
        .then(function (data) {
            votes = data.votes;
            precinctToWard = data.precinctToWard;
        })
        .then(() => fetch('precincts/temp.json'))
        .then(response => response.json())
        .then(function (geoJson) {
            const tileLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/kcivey.i8d7ca3k/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' +
                    '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
                    '<strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">' +
                    'Improve this map</a></strong>',
                opacity: 0.5,
            });
            const electionResults = new ElectionResults(votes, precinctToWard);
            const candidate = 'Jordan Grossman';
            electionResults.setCurrentContest('Dem Council Ward 2')
                .setCurrentCandidate(candidate);
            const data = function (id) {
                const precinctNumber = id.replace(/^\D*/, '');
                return electionResults.getPrecinct(precinctNumber);
            };
            const style = function (feature, precinct) {
                const lightness = (100 - precinct.getPercent(candidate)).toFixed(1);
                const color = `rgb(${lightness}%,${lightness}%,${lightness}%)`;
                return {
                    fillColor: color,
                    color,
                    weight: 1,
                    fillOpacity: 0.6,
                };
            };
            const candidates = electionResults.getCandidates();
            const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628'];
            const candidateColors = {};
            candidates.forEach(function (candidate, i) {
                candidateColors[candidate] = colors[i % candidates.length];
            });
            const style2 = function (feature, precinct) {
                const winner = precinct.getWinner();
                const color = candidateColors[winner];
                return {
                    fillColor: color,
                    color,
                    weight: 1,
                    fillOpacity: 0.6,
                };
            };
            const map = new Choropleth(geoJson, {tileLayer, style, data, usePopups: false}).display();
            setTimeout(() => map.setStyle(style2), 2000);
        });
});
