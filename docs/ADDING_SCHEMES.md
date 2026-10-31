# Maintainer Guide: Adding New Government Schemes

The Government Sahayak architecture is entirely data-driven. New welfare schemes can be added or updated with zero mobile client releases. Once updated on the server, the mobile app downloads the update atomically via `/api/export`.

---

## 1. Adding a New Scheme in 5 Steps

### Step 1: Define Required Fact Fields (`data/fields.json`)
If the new scheme requires citizen questions not already present in `data/fields.json`, add the field definition:
```json
"has_job_card": {
  "type": "bool",
  "en": "Do you hold an active MGNREGA job card?",
  "te": "మీకు ఉపాధి హామీ పథకం యాక్టివ్ జాబ్ కార్డు ఉందా?"
}
```

### Step 2: Append Scheme Definition (`data/schemes.json`)
Add the scheme object following the schema:
- `scheme_id`: lowercase slug (e.g. `mgnrega`)
- `category`: one of `agriculture`, `pension`, `health`, `housing`, `women_family`, `education`, or `employment`. *(Note: The Employment category will appear automatically on the mobile app as soon as an employment scheme is added).*
- `rules`: `{ "paths": [[ { "field": "...", "op": "is|gte|lte|gt|lt", "value": ..., "kind": "hard|list|advisory", "en": "...", "te": "..." } ]] }`
- `sources`: Must include at least one `official` or `government-portal` URL.
- `known_discrepancies`: Explicitly record any conflicts between central guidelines and state circulars.

### Step 3: Add Evaluation Test Cases (`data/eval_set.json`)
Add test cases for eligible, not-eligible, and boundary conditions to ensure zero regressions:
```json
{
  "case_id": "CASE-25",
  "scheme_id": "mgnrega",
  "description": "Rural adult wanting unskilled manual work",
  "facts": { "age": 25, "rural_resident": true },
  "expected_status": "eligible"
}
```

### Step 4: Rebuild Database
Run the database synchronization script:
```bash
python -m backend.app.db.init_db
```

### Step 5: Verify Automated Test Suite
```bash
python -m pytest backend/tests/ -v
cd mobile && npm test
```
The new scheme is now live. On next launch, connected mobile apps will detect the updated version hash and automatically synchronize the dataset for both online and offline usage.
