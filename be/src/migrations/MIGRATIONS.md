# Database Migrations

## Purpose

This directory contains the SQL migration history for the Greenhouse Monitoring System backend.

Migrations describe database schema changes and initial data inserts. They are maintained as versioned SQL files and are currently applied manually using MySQL Workbench.

## Directory Structure

- `migrations/`: numbered SQL migration files.
- `MIGRATIONS.md`: migration workflow and maintenance guidelines.

Migration files follow this naming convention:

`NNN_description.sql`

The numeric prefix establishes the intended execution order.

## Current Migration History

The repository currently contains migrations `001` through `018`, covering:

- Sensors and initial sensor data.
- Sensor readings and sample readings.
- Device registration and sensor-device relationships.
- Actuators and initial actuator data.
- Device commands and their integrity constraints.
- Environmental alerts.

The existing migration files represent the project's historical development. They must not be assumed to be safe to execute repeatedly.

## Database Environments

The project uses separate MySQL databases for development and testing:

- `greenhouse_db`
- `greenhouse_test`

Both databases currently contain the following tables:

- `devices`
- `sensors`
- `readings`
- `actuators`
- `commands`
- `environmental_alerts`

The presence of these tables does not, by itself, guarantee that their columns, indexes, constraints, or data are identical.

## Applying Migrations

Migrations are currently applied manually through MySQL Workbench. There is no automated migration runner or migration history table.

Before applying a migration:

1. Read the entire SQL file.
2. Confirm the intended target database.
3. Check whether the migration's operations have already been applied.
4. Back up important data before making potentially destructive schema changes.
5. Apply the migration in the intended order.
6. Verify the resulting schema and data.
7. Run the backend test suite.

Do not execute all historical migration files against an existing database without first reviewing their effects.

Some historical migrations create tables, insert seed data, add constraints, or modify existing records. Re-executing them can cause errors, duplicate data, or unintended changes.

## Creating New Migrations

For every new database schema change:

1. Create a new SQL file in `migrations/`.
2. Use the next available numeric prefix.
3. Give the file a descriptive name, for example `019_add_sensor_metadata.sql`.
4. Keep the migration focused on one logical change.
5. Review foreign keys, indexes, nullability, defaults, and data integrity.
6. Apply and verify the migration in the required environments.
7. Commit the SQL file together with any related application and test changes.

Previously committed migrations should normally be treated as historical records. If a new change is required, create another migration rather than silently rewriting an earlier one.

## Testing

Run the backend test suite from the `be/` directory:

```powershell
npm test
```

The test database must have the schema required by the application and its tests. When a new table is introduced, update the test database setup and cleanup logic as needed.

Database changes should be tested before they are considered complete.

## Important Limitations

Migration execution is currently a manual process. The repository does not automatically track which migration files have been applied to each database.

Consequently, the numbered files document the intended migration history, but they are not a verified record of the exact migration state of every database.
