# User Credentials directory

This directory contains credentials files, where each file contains a single user's credentials for
each of the data sources for which they have an account.

Our ETL process will iterate over each of these credentials files, and execute the ETL process for
each one, thereby loading data from each data source into that user's Solid Pod.

Some data sources may be optional (i.e., a user not having an account, or not providing their
credentials for that account if they do have one), meaning the ETL process will simply not attempt
to extract, transform and load data for that user from that data source.