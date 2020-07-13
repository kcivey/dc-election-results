#!/usr/bin/env bash

for URL in \
https://electionresults.dcboe.org/Downloads/Reports/June_16_2020_Special_Election_Certified_Results.csv \ll
https://electionresults.dcboe.org/Downloads/Reports/June_2_2020_Primary_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/December_4_2018_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/November_6_2018_General_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/June_19_2018_Primary_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/November_8_2016_General_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/June_14_2016_Primary_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/April_28_2015_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/November_4_2014_General_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/July_15_2014_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/April_1_2014_Primary_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/April_23_2013_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/November_6_2012_General_and_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/May_15_2012_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/April_3_2012_Primary_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/April_26_2011_Special_Election_Certified_Results.csv \
https://electionresults.dcboe.org/Downloads/Reports/PreCertified_General_Election_Results_2010.xls \
https://electionresults.dcboe.org/Downloads/Reports/primary_election_results_2010.xls \
https://dcboe.org/dcboe/media/PDFFiles/General_08_Certified_Results_Precinct.xls \
https://dcboe.org/dcboe/media/PDFFiles/Primary_08_Certified_Results_Precinct.xls \
https://dcboe.org/dcboe/media/PDFFiles/PresidentialGeneral_08_Certified_Feb_Election_Results.pdf \
https://dcboe.org/dcboe/media/PDFFiles/pn_126.pdf \
https://dcboe.org/dcboe/media/PDFFiles/nr_113.pdf \
https://dcboe.org/dcboe/media/PDFFiles/Precinct_General_2006.pdf \
https://dcboe.org/dcboe/media/PDFFiles/ey2006_primary_summary.pdf \
https://dcboe.org/dcboe/media/PDFFiles/Precinct_Report_Nov2.pdf \
https://dcboe.org/dcboe/media/ArchivedElectionResults/14Sep2004_Precinct_Report.pdf \
https://dcboe.org/dcboe/media/PDFFiles/ey2004_presprimary_precinct.pdf \
https://dcboe.org/dcboe/media/ArchivedElectionResults/Precincts170.zip \
https://dcboe.org/dcboe/media/ArchivedElectionResults/Precincts71141.zip \
https://dcboe.org/dcboe/media/ArchivedElectionResults/11-7-00pct.zip \
https://dcboe.org/dcboe/media/ArchivedElectionResults/09-12-00.zip \
https://dcboe.org/Elections/Election-Results-Archives/Election-Year-2000/June-27-Special-Election-on-Charter-Amendment-III \
https://dcboe.org/dcboe/media/ArchivedElectionResults/pct_may200.zip \
https://dcboe.org/dcboe/media/ArchivedElectionResults/pctnov98.zip \
https://dcboe.org/dcboe/media/ArchivedElectionResults/sep98pct.zip \
https://dcboe.org/dcboe/media/PDFFiles/1997_spec_elec_results.pdf \
https://dcboe.org/Elections/Election-Results-Archives/Election-Year-1997/April-29-Special-Election-for-Ward-6-Member-of-the \
https://dcboe.org/dcboe/media/PDFFiles/Ward8_results_1995.pdf \
https://dcboe.org/dcboe/media/PDFFiles/sep94pct.zip \
https://dcboe.org/dcboe/media/PDFFiles/1993_spec_elec_results.pdf \
https://dcboe.org/getmedia/c4a8c24b-f61c-4179-a9ed-13977d936310/1992_May_results.aspx \
https://dcboe.org/dcboe/media/PDFFiles/1992_Sept_results.pdf \
https://dcboe.org/dcboe/media/PDFFiles/1992_Nov_results.pdf ;
do
    FILE=${URL##*/}
    echo $FILE
    if [[ ! -f $FILE ]]; then
        wget $URL
    fi
done
