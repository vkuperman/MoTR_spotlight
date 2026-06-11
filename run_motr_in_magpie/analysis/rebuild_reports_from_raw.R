## Rebuild fixation_report.csv and interest_area_report.csv from raw_trial_data.csv
## for every motr_results_* folder under Results/.
##
## From MoTR_spotlight repo root:
##   source("run_motr_in_magpie/analysis/rebuild_reports_from_raw.R")

if (basename(getwd()) == "analysis") {
  setwd(normalizePath(file.path(getwd(), "..", ".."), winslash = "/"))
} else if (basename(getwd()) == "run_motr_in_magpie") {
  setwd(normalizePath(file.path(getwd(), ".."), winslash = "/"))
}

results_dir <- "Results"
rebuild_reports_script <- "run_motr_in_magpie/analysis/rebuild_reports_from_raw.py"

py <- Sys.which("python")
if (identical(py, "")) py <- Sys.which("python3")
if (identical(py, "")) {
  stop("Python not found on PATH. Install Python 3 with pandas, then retry.")
}

script_path <- normalizePath(file.path(getwd(), rebuild_reports_script), winslash = "/", mustWork = TRUE)
results_path <- normalizePath(file.path(getwd(), results_dir), winslash = "/", mustWork = TRUE)

message("Rebuilding reports under: ", results_path)
status <- system2(py, c(shQuote(script_path), shQuote(results_path)))
if (!identical(status, 0L)) {
  stop("rebuild_reports_from_raw.py failed with status ", status)
}
message("Done.")
