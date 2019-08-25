#!/usr/bin/env bash

for F in \
    December_4_2018_Special_Election_Certified_Results.csv \
    November_6_2018_General_Election_Certified_Results.csv \
    June_19_2018_Primary_Election_Certified_Results.csv \
    November_8_2016_General_Election_Certified_Results.csv \
    June_14_2016_Primary_Election_Certified_Results.csv \
    April_28_2015_Special_Election_Certified_Results.csv \
    November_4_2014_General_Election_Certified_Results.csv \
    July_15_2014_Special_Election_Certified_Results.csv \
    April_1_2014_Primary_Election_Certified_Results.csv \
    April_23_2013_Special_Election_Certified_Results.csv \
    November_6_2012_General_and_Special_Election_Certified_Results.csv \
    May_15_2012_Special_Election_Certified_Results.csv \
    April_3_2012_Primary_Election_Certified_Results.csv \
    April_26_2011_Special_Election_Certified_Results.csv \
    PreCertified_General_Election_Results_2010.xls \
    primary_election_results_2010.xls ;
do
    if [[ ! -f $F ]]; then
        wget https://electionresults.dcboe.org/Downloads/Reports/$F
    fi
done
