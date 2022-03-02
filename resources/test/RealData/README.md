# Real Data directory

The intention of this directory is to hold local copies of real data, such as
real responses from data source APIs from real user accounts that we can use
during the development process (so that we don't make repeated API calls, or so
that we can run our ETL process fully offline).

Generally, the contents of this directory should not be committed to source
control, as we'd typically expect them to contain sensitive user data (e.g.,
when requesting user-specific data), but we may also include real responses from
public APIs too (e.g., a company name search via a public government search
API).
