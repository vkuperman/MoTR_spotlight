## Fill missing interest-area metadata (word, line_number, position_in_line)
##
## This script is intended to be run **after** collecting data from the spotlight
## experiment. It reads:
##   1. The exported `interest_area_report.csv`
##   2. OneStop passage CSV files from `run_motr_in_magpie/OneStop/Texts`
## and joins them by `onestop_article_number`, `onestop_paragraph_number`,
## `onestop_level`, and `word_index` to fill in missing values for:
##   - `word`
##   - `line_number`
##   - `position_in_line`
##
## The output is a new CSV (by default, `interest_area_report_filled.csv`)
## with the filled-in metadata.

## ------------------------- User configuration ------------------------- ##

# MoTR_spotlight repo root (parent of run_motr_in_magpie).
if (basename(getwd()) == "analysis") {
  setwd(normalizePath(file.path(getwd(), "..", ".."), winslash = "/"))
} else if (basename(getwd()) == "run_motr_in_magpie") {
  setwd(normalizePath(file.path(getwd(), ".."), winslash = "/"))
}

# Where your exported results live.
results_dir <- "Results"

# Path to the interest-area CSV exported by the browser (fallback if no ZIPs are present).
interest_area_csv <- file.path(results_dir, "interest_area_report.csv")

# If TRUE, combine all participant IA reports first, then fill metadata on that combined table.
combine_all_participants <- TRUE

# When ZIPs are present in `results_dir`, the script will extract `interest_area_report.csv` from them.
zip_pattern <- "motr_results_.*\\.zip$"

# Fallback: where to search for participant IA CSV files when combine_all_participants = TRUE and no ZIPs exist.
participant_reports_pattern <- "interest_area_report\\.csv$"
combined_output_csv <- file.path(results_dir, "interest_area_report_all_participants.csv")

# Directory containing the OneStop items CSV files.
items_dir <- "run_motr_in_magpie/OneStop/Texts"

# Pattern matching the OneStop items CSV files.
items_pattern <- "\\.csv$"

# Output CSV path.
output_csv <- file.path(results_dir, "interest_area_report_filled.csv")

# Rebuild fixation_report.csv / interest_area_report.csv from raw_trial_data.csv first.
# Fixes stale snapshot uploads where IA/fixation were exported before all hovers were logged.
rebuild_reports_from_raw <- TRUE
rebuild_reports_script <- "run_motr_in_magpie/analysis/rebuild_reports_from_raw.py"

## --------------------------------------------------------------------- ##
suppressWarnings({
  if (!requireNamespace("dplyr", quietly = TRUE)) install.packages("dplyr")
  if (!requireNamespace("readr", quietly = TRUE)) install.packages("readr")
  if (!requireNamespace("stringr", quietly = TRUE)) install.packages("stringr")
})

library(dplyr)
library(readr)
library(stringr)

if (rebuild_reports_from_raw) {
  py <- Sys.which("python")
  if (identical(py, "")) py <- Sys.which("python3")
  script_path <- file.path(getwd(), rebuild_reports_script)
  results_path <- file.path(getwd(), results_dir)
  if (identical(py, "")) {
    warning("Python not found on PATH; skipping rebuild_reports_from_raw.")
  } else if (!file.exists(script_path)) {
    warning("Rebuild script not found: ", script_path)
  } else {
    message("Rebuilding fixation/IA reports from raw_trial_data.csv under ", results_path, " ...")
    status <- system2(py, c(shQuote(normalizePath(script_path, winslash = "/")), shQuote(normalizePath(results_path, winslash = "/"))))
    if (!identical(status, 0L)) {
      warning("rebuild_reports_from_raw.py exited with status ", status)
    }
  }
}

prefer_rebuilt_interest_area_csv <- function(path) {
  if (!grepl("interest_area_report\\.csv$", path, ignore.case = TRUE)) return(path)
  if (grepl("_rebuilt\\.csv$", path, ignore.case = TRUE)) return(path)
  rebuilt <- sub("interest_area_report\\.csv$", "interest_area_report_rebuilt.csv", path, ignore.case = TRUE)
  if (file.exists(rebuilt)) rebuilt else path
}

get_interest_area_csv_entries_from_results <- function(results_dir, zip_pattern, participant_reports_pattern) {
  zip_files <- list.files(results_dir, pattern = zip_pattern, full.names = TRUE)

  if (length(zip_files) > 0) {
    message("Found ZIP result file(s) in ", results_dir, "; extracting interest_area_report.csv from them...")
    tmp_base <- tempfile("motr_ia_unzip_")
    dir.create(tmp_base, showWarnings = FALSE, recursive = TRUE)

    paths <- character()
    sources <- character()

    for (z in zip_files) {
      z_base <- basename(z)
      unzip_dir <- file.path(tmp_base, tools::file_path_sans_ext(z_base))
      dir.create(unzip_dir, showWarnings = FALSE, recursive = TRUE)
      utils::unzip(z, exdir = unzip_dir)

      ia_paths <- list.files(unzip_dir, pattern = "^interest_area_report(_rebuilt)?\\.csv$", full.names = TRUE, recursive = TRUE)
      ia_paths <- ia_paths[!grepl("pre_rebuild_bak", ia_paths, ignore.case = TRUE)]
      ia_paths <- unique(vapply(ia_paths, prefer_rebuilt_interest_area_csv, character(1)))
      if (length(ia_paths) == 0) {
        stop("No interest_area_report.csv found inside ZIP: ", z)
      }
      # If more than one exists, keep them all.
      paths <- c(paths, ia_paths)
      sources <- c(sources, rep(z_base, length(ia_paths)))
    }
    return(list(paths = paths, sources = sources))
  }

  message("No ZIPs found; using existing CSV files in ", results_dir)
  files <- list.files(results_dir, pattern = participant_reports_pattern, full.names = TRUE, recursive = TRUE)
  files <- files[!grepl("filled\\.csv$", files, ignore.case = TRUE)]
  files <- files[!grepl("all_participants\\.csv$", files, ignore.case = TRUE)]
  files <- files[!grepl("_rebuilt\\.csv$", files, ignore.case = TRUE)]
  files <- unique(vapply(files, prefer_rebuilt_interest_area_csv, character(1)))
  if (length(files) == 0) {
    stop("No participant IA CSV files found in ", results_dir, " matching pattern ", participant_reports_pattern)
  }
  list(paths = files, sources = basename(files))
}

combine_interest_area_reports <- function(ia_paths, sources, output_path) {
  message("Combining ", length(ia_paths), " interest-area CSV file(s)...")
  frames <- lapply(seq_along(ia_paths), function(i) {
    f <- ia_paths[[i]]
    # Read all columns as character to avoid type collisions across participant files
    # (e.g., SONAId inferred as numeric in one file and character in another).
    d <- readr::read_csv(f, col_types = readr::cols(.default = readr::col_character()), show_col_types = FALSE)
    d$source_file <- sources[[i]]
    d
  })
  combined <- dplyr::bind_rows(frames)
  readr::write_csv(combined, output_path, na = "")
  message("Wrote combined IA report to: ", output_path)
  combined
}

if (combine_all_participants) {
  entries <- get_interest_area_csv_entries_from_results(results_dir, zip_pattern, participant_reports_pattern)
  ia <- combine_interest_area_reports(entries$paths, entries$sources, combined_output_csv)
} else {
  message("Reading interest-area report from: ", interest_area_csv)
  ia <- readr::read_csv(
    interest_area_csv,
    col_types = readr::cols(.default = readr::col_character()),
    show_col_types = FALSE
  )
}

message("Searching for OneStop items CSV files in: ", items_dir)
item_files <- list.files(items_dir, pattern = items_pattern, full.names = TRUE)

if (length(item_files) == 0) {
  stop("No OneStop items CSV files found in ", items_dir, " matching pattern ", items_pattern)
}

message("Found ", length(item_files), " items file(s):")
print(item_files)

normalize_onestop_level <- function(x) {
  x <- tolower(trimws(as.character(x)))
  dplyr::case_when(
    x %in% c("ele", "elementary", "elem") ~ "ele",
    x %in% c("int", "intermediate", "inter") ~ "int",
    x %in% c("adv", "advanced") ~ "adv",
    TRUE ~ x
  )
}

normalize_onestop_number <- function(x) {
  n <- suppressWarnings(as.integer(as.character(x)))
  ifelse(is.na(n), NA_character_, as.character(n))
}

# Match spotlight App.vue tokenization: trial.text.split(' ')
tokenize_onestop_text <- function(txt) {
  if (is.na(txt) || as.character(txt) == "") return(character())
  words <- strsplit(trimws(as.character(txt)), " ", fixed = TRUE)[[1]]
  words[nzchar(words)]
}

resolve_onestop_level_column <- function(cn, level_key) {
  lower <- tolower(trimws(cn))
  level_name <- switch(
    level_key,
    ele = "elementary",
    int = "intermediate",
    adv = "advanced"
  )
  hit <- cn[match(level_name, lower)]
  if (!is.na(hit)) return(hit)
  cn[grepl(paste0("^", level_name), lower)][1]
}

read_onestop_items_file <- function(path) {
  message("Reading OneStop items file: ", path)
  df <- readr::read_csv(
    path,
    show_col_types = FALSE,
    locale = readr::locale(encoding = "Latin1")
  )

  cn <- names(df)
  lower <- tolower(trimws(cn))

  article_col <- cn[match("article number", lower)]
  if (is.na(article_col)) {
    article_col <- cn[grepl("^article.?number", lower)][1]
  }
  paragraph_col <- cn[match("paragraph", lower)]

  if (is.na(article_col) || is.na(paragraph_col)) {
    warning("Skipping ", path, ": missing 'Article Number' and/or 'Paragraph' columns.")
    return(data.frame())
  }

  level_specs <- list(
    ele = resolve_onestop_level_column(cn, "ele"),
    int = resolve_onestop_level_column(cn, "int"),
    adv = resolve_onestop_level_column(cn, "adv")
  )

  out_list <- list()
  for (i in seq_len(nrow(df))) {
    article_num <- normalize_onestop_number(df[[article_col]][i])
    paragraph_num <- normalize_onestop_number(df[[paragraph_col]][i])
    if (is.na(article_num) || is.na(paragraph_num)) next

    for (level_key in names(level_specs)) {
      col <- level_specs[[level_key]]
      if (is.na(col) || !col %in% cn) next
      words <- tokenize_onestop_text(df[[col]][i])
      if (length(words) == 0) next
      out_list[[length(out_list) + 1]] <- data.frame(
        onestop_article_number = article_num,
        onestop_paragraph_number = paragraph_num,
        onestop_level = level_key,
        word_index = seq_along(words),
        word_from_items = words,
        line_number_from_items = NA_character_,
        position_in_line_from_items = NA_character_,
        stringsAsFactors = FALSE
      )
    }
  }
  dplyr::bind_rows(out_list)
}

items_list <- lapply(item_files, read_onestop_items_file)
items_all <- bind_rows(items_list) %>%
  distinct(onestop_article_number, onestop_paragraph_number, onestop_level, word_index, .keep_all = TRUE)

if (nrow(items_all) == 0) {
  stop("No OneStop word metadata could be built from files in ", items_dir)
}

build_itemid_onestop_lookup <- function(ia_df) {
  ia_df %>%
    mutate(
      onestop_article_number = normalize_onestop_number(onestop_article_number),
      onestop_paragraph_number = normalize_onestop_number(onestop_paragraph_number),
      onestop_level = normalize_onestop_level(onestop_level)
    ) %>%
    filter(
      !is.na(.data$participant_id), .data$participant_id != "",
      !is.na(.data$ItemId), .data$ItemId != "",
      !is.na(.data$onestop_article_number),
      !is.na(.data$onestop_paragraph_number),
      !is.na(.data$onestop_level), .data$onestop_level != ""
    ) %>%
    distinct(.data$participant_id, .data$ItemId, .keep_all = TRUE) %>%
    transmute(
      participant_id = as.character(.data$participant_id),
      ItemId = as.character(.data$ItemId),
      onestop_article_number_fill = .data$onestop_article_number,
      onestop_paragraph_number_fill = .data$onestop_paragraph_number,
      onestop_level_fill = .data$onestop_level
    )
}

make_trial_key <- function(participant_id, onestop_article_number, onestop_paragraph_number, onestop_level, item_id) {
  passage_key <- ifelse(
    is.na(onestop_article_number) | onestop_article_number == "",
    paste0("item:", item_id),
    paste(onestop_article_number, onestop_paragraph_number, onestop_level, sep = "|")
  )
  paste(as.character(participant_id), passage_key, sep = "::")
}

message("Joining OneStop items metadata onto interest-area report...")

ia <- ia %>%
  mutate(
    participant_id = as.character(participant_id),
    ItemId = as.character(ItemId),
    onestop_article_number = normalize_onestop_number(onestop_article_number),
    onestop_paragraph_number = normalize_onestop_number(onestop_paragraph_number),
    onestop_level = normalize_onestop_level(onestop_level)
  )

itemid_onestop_lookup <- build_itemid_onestop_lookup(ia)

ia <- ia %>%
  left_join(itemid_onestop_lookup, by = c("participant_id", "ItemId")) %>%
  mutate(
    onestop_article_number = if_else(
      is.na(onestop_article_number) | onestop_article_number == "",
      onestop_article_number_fill,
      onestop_article_number
    ),
    onestop_paragraph_number = if_else(
      is.na(onestop_paragraph_number) | onestop_paragraph_number == "",
      onestop_paragraph_number_fill,
      onestop_paragraph_number
    ),
    onestop_level = if_else(
      is.na(onestop_level) | onestop_level == "",
      onestop_level_fill,
      onestop_level
    )
  ) %>%
  select(-onestop_article_number_fill, -onestop_paragraph_number_fill, -onestop_level_fill)

# Build fallback lookup for line_number / position_in_line from observed clicks
# in the IA data itself (useful when item TSVs lack these columns).
line_pos_lookup <- ia %>%
  mutate(
    trial_key = make_trial_key(
      participant_id,
      onestop_article_number,
      onestop_paragraph_number,
      onestop_level,
      ItemId
    ),
    word_index = as.integer(word_index),
    line_number = as.character(line_number),
    position_in_line = as.character(position_in_line)
  ) %>%
  group_by(trial_key, word_index) %>%
  summarise(
    line_number_obs = {
      vals <- line_number[!is.na(line_number) & line_number != ""]
      if (length(vals) > 0) vals[[1]] else NA_character_
    },
    position_in_line_obs = {
      vals <- position_in_line[!is.na(position_in_line) & position_in_line != ""]
      if (length(vals) > 0) vals[[1]] else NA_character_
    },
    .groups = "drop"
  )

infer_line_pos_lookup <- function(ia_df, anchor_lookup) {
  ia_df <- ia_df %>%
    mutate(
      trial_key = make_trial_key(
        participant_id,
        onestop_article_number,
        onestop_paragraph_number,
        onestop_level,
        ItemId
      )
    )
  items <- unique(as.character(ia_df$trial_key))
  out <- list()
  for (item in items) {
    idxs <- sort(unique(as.integer(ia_df$word_index[as.character(ia_df$trial_key) == item])))
    idxs <- idxs[!is.na(idxs)]
    if (length(idxs) == 0) next

    n <- max(idxs)
    ln <- rep(NA_integer_, n)
    pos <- rep(NA_integer_, n)

    anchors <- anchor_lookup %>%
      filter(trial_key == item) %>%
      mutate(
        word_index = as.integer(word_index),
        line_number_obs = suppressWarnings(as.integer(line_number_obs)),
        position_in_line_obs = suppressWarnings(as.integer(position_in_line_obs))
      ) %>%
      arrange(word_index)

    if (nrow(anchors) > 0) {
      for (k in seq_len(nrow(anchors))) {
        wi <- anchors$word_index[k]
        if (!is.na(wi) && wi >= 1 && wi <= n) {
          ln[wi] <- anchors$line_number_obs[k]
          pos[wi] <- anchors$position_in_line_obs[k]
        }
      }
    }

    # Forward pass: continue same line and increment position when missing.
    for (i in 2:n) {
      if (is.na(ln[i]) && !is.na(ln[i - 1])) ln[i] <- ln[i - 1]
      if (is.na(pos[i]) && !is.na(pos[i - 1])) pos[i] <- pos[i - 1] + 1L
    }
    # Backward pass: infer from next known token.
    if (n >= 2) {
      for (i in (n - 1):1) {
        if (is.na(ln[i]) && !is.na(ln[i + 1])) ln[i] <- ln[i + 1]
        if (is.na(pos[i]) && !is.na(pos[i + 1])) pos[i] <- pos[i + 1] - 1L
      }
    }
    # Clamp impossible positions.
    pos[pos < 1] <- 1L

    out[[length(out) + 1]] <- data.frame(
      trial_key = item,
      word_index = seq_len(n),
      line_number_infer = as.character(ln),
      position_in_line_infer = as.character(pos),
      stringsAsFactors = FALSE
    )
  }
  dplyr::bind_rows(out)
}

line_pos_infer <- infer_line_pos_lookup(ia, line_pos_lookup)

ia_joined <- ia %>%
  mutate(
    trial_key = make_trial_key(
      participant_id,
      onestop_article_number,
      onestop_paragraph_number,
      onestop_level,
      ItemId
    ),
    word_index = as.integer(word_index),
    line_number = as.character(line_number),
    position_in_line = as.character(position_in_line)
  ) %>%
  left_join(
    items_all,
    by = c("onestop_article_number", "onestop_paragraph_number", "onestop_level", "word_index")
  ) %>%
  left_join(line_pos_lookup, by = c("trial_key", "word_index")) %>%
  left_join(line_pos_infer, by = c("trial_key", "word_index")) %>%
  mutate(
    word = if_else(is.na(word) | word == "", word_from_items, word),
    line_number = if_else(
      (is.na(line_number) | line_number == "") & !is.na(line_number_from_items),
      as.character(line_number_from_items),
      as.character(line_number)
    ),
    line_number = if_else(
      (is.na(line_number) | line_number == "") & !is.na(line_number_obs),
      as.character(line_number_obs),
      as.character(line_number)
    ),
    position_in_line = if_else(
      (is.na(position_in_line) | position_in_line == "") & !is.na(position_in_line_from_items),
      as.character(position_in_line_from_items),
      as.character(position_in_line)
    ),
    position_in_line = if_else(
      (is.na(position_in_line) | position_in_line == "") & !is.na(position_in_line_obs),
      as.character(position_in_line_obs),
      as.character(position_in_line)
    ),
    line_number = if_else(
      (is.na(line_number) | line_number == "") & !is.na(line_number_infer),
      as.character(line_number_infer),
      as.character(line_number)
    ),
    position_in_line = if_else(
      (is.na(position_in_line) | position_in_line == "") & !is.na(position_in_line_infer),
      as.character(position_in_line_infer),
      as.character(position_in_line)
    )
  ) %>%
  select(
    -trial_key,
    -word_from_items,
    -line_number_from_items,
    -position_in_line_from_items,
    -line_number_obs,
    -position_in_line_obs,
    -line_number_infer,
    -position_in_line_infer
  )

# Recalculate character-based landing coordinates so that for non-initial words
# the preceding space counts as one character in word-length space.
fmt4 <- function(x) ifelse(is.na(x), "", sprintf("%.4f", x))

ia_joined <- ia_joined %>%
  mutate(
    position_in_line_num = suppressWarnings(as.numeric(position_in_line)),
    has_leading_space = !is.na(position_in_line_num) & position_in_line_num > 1,
    first_click_x_from_word_left_chars_num = suppressWarnings(as.numeric(first_click_x_from_word_left_chars)),
    word_len_clean = nchar(gsub("[[:punct:]]", "", ifelse(is.na(word), "", as.character(word)))),
    first_click_x_from_word_left_chars = if_else(
      is.na(first_click_x_from_word_left_chars_num),
      "",
      fmt4(first_click_x_from_word_left_chars_num + if_else(has_leading_space, 1, 0))
    ),
    first_click_x_from_word_center_chars = if_else(
      is.na(first_click_x_from_word_left_chars_num) | word_len_clean <= 0,
      "",
      fmt4(
        (first_click_x_from_word_left_chars_num + if_else(has_leading_space, 1, 0)) -
          ((word_len_clean + if_else(has_leading_space, 1, 0)) / 2)
      )
    )
  ) %>%
  select(
    -position_in_line_num,
    -has_leading_space,
    -first_click_x_from_word_left_chars_num,
    -word_len_clean
  )

message("Writing filled interest-area report to: ", output_csv)
write_ok <- TRUE
tryCatch(
  {
    readr::write_csv(ia_joined, output_csv, na = "")
  },
  error = function(e) {
    write_ok <<- FALSE
    message("Primary output is locked/unwritable: ", e$message)
  }
)

if (!write_ok) {
  alt_output_csv <- file.path(results_dir, "interest_area_report_filled_recalculated.csv")
  message("Writing fallback output to: ", alt_output_csv)
  readr::write_csv(ia_joined, alt_output_csv, na = "")
  message("Done. Recalculated filled report saved at: ", alt_output_csv)
} else {
  message("Done. Filled interest-area report saved at: ", output_csv)
}

