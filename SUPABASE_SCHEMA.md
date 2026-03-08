# Supabase / PostgreSQL Schema Proposal

Based on the current UI and functionality of the Skim Pintar Dashboard, here is the recommended database schema.

## 1. `donators`
This is the master table storing all applicants and active members.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (default: `gen_random_uuid()`) |
| `full_name` | `text` | Name of the donator |
| `tier` | `text` | 'Individual' or 'Household' |
| `is_discounted` | `boolean` | `true` if 50% discount applies |
| `monthly_amount` | `numeric` | The subscription amount (e.g., 50.00) |
| `status` | `text` | 'Active', 'Inactive', 'Pending Giro', 'Pending e-Giro' |
| `bounce_count` | `integer` | Current streak of failed payments (0, 1, 2) |
| `submitted_at` | `timestamptz` | When the application was received |
| `approved_at` | `timestamptz` | When they became 'Active' |
| `created_at` | `timestamptz` | Default `now()` |

## 2. `household_members`
Stores the family members for donators on the "Household" tier.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `donator_id` | `uuid` | Foreign Key referencing `donators.id` |
| `full_name` | `text` | Name of the family member |
| `relationship` | `text` | 'Immediate Family' or 'Parent/In-law' |

## 3. `payments`
Tracks the monthly transaction history shown in the drawer and audit log.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `donator_id` | `uuid` | Foreign Key referencing `donators.id` |
| `amount` | `numeric` | Amount attempted/paid |
| `status` | `text` | 'Paid', 'Bounced' |
| `payment_date` | `date` | The date of the transaction |
| `notes` | `text` | Optional details (e.g., "Insufficient funds") |
| `created_at` | `timestamptz` | Default `now()` |

---

## SQL Definition

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Donators Table
create table donators (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  tier text check (tier in ('Individual', 'Household')) not null,
  is_discounted boolean default false,
  monthly_amount numeric(10, 2) not null,
  status text check (status in ('Active', 'Inactive', 'Pending Giro', 'Pending e-Giro')) not null,
  bounce_count int default 0,
  submitted_at timestamptz default now(),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- 2. Household Members Table
create table household_members (
  id uuid primary key default uuid_generate_v4(),
  donator_id uuid references donators(id) on delete cascade,
  full_name text not null,
  relationship text check (relationship in ('Immediate Family', 'Parent/In-law')) not null
);

-- 3. Payments / Audit Log Table
create table payments (
  id uuid primary key default uuid_generate_v4(),
  donator_id uuid references donators(id) on delete cascade,
  amount numeric(10, 2) not null,
  status text check (status in ('Paid', 'Bounced')) not null,
  payment_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_donators_status on donators(status);
create index idx_household_donator on household_members(donator_id);
create index idx_payments_donator on payments(donator_id);
```
