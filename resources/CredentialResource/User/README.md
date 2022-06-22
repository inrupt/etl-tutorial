# User Credentials directory

This directory (and potentially it's subdirectories) can contain credential
files, where each file contains a single user's credentials for each of the data
sources for which they may have an account.

Our ETL process can iterate over each of these credentials files, and execute
the ETL process for each one, thereby Extracting data from each data source for
which that user may have provided their credentials, Transforming that data into
Linked Data, and Loading it into that user's Solid Pod.

It's important to re-iterate that for each user, data sources may be optional
(i.e., a user not having an account, or not providing their credentials for
their account even if they do have one), meaning the ETL process will simply not
attempt to Extract, Transform, and Load data for that user for that particular
data source.