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
  status text check (status in ('Paid', 'Bounced', 'No Record')) not null,
  payment_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_donators_status on donators(status);
create index idx_household_donator on household_members(donator_id);
create index idx_payments_donator on payments(donator_id);

-- Enable Row Level Security (RLS)
alter table donators enable row level security;
alter table household_members enable row level security;
alter table payments enable row level security;

-- Create policies (Allow public read/write for demo purposes - in production, restrict to authenticated users)
create policy "Allow public access to donators" on donators for all using (true);
create policy "Allow public access to household_members" on household_members for all using (true);
create policy "Allow public access to payments" on payments for all using (true);

-- SEED DATA
-- We use temporary variables or specific UUIDs to link tables. 
-- For simplicity in this script, we'll use CTEs (Common Table Expressions) to insert and link data.

WITH 
  -- Insert Donator 1: Ahmad bin Sulaiman
  d1 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Ahmad bin Sulaiman', 'Individual', false, 50.00, 'Active', 0)
    RETURNING id
  ),
  -- Insert Donator 2: Siti Nurhaliza
  d2 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Siti Nurhaliza', 'Household', true, 80.00, 'Active', 1)
    RETURNING id
  ),
  -- Insert Donator 3: Farid Kamil
  d3 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Farid Kamil', 'Individual', false, 30.00, 'Active', 2)
    RETURNING id
  ),
  -- Insert Donator 4: Zainab binti Ali
  d4 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Zainab binti Ali', 'Household', false, 100.00, 'Active', 0)
    RETURNING id
  ),
  -- Insert Donator 5: Omar Abdullah
  d5 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Omar Abdullah', 'Individual', true, 25.00, 'Active', 0)
    RETURNING id
  ),
  -- Insert Donator 6: Khadijah Ibrahim
  d6 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Khadijah Ibrahim', 'Household', true, 60.00, 'Inactive', 0)
    RETURNING id
  ),
  -- Insert Donator 7: Yusof Haslam
  d7 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Yusof Haslam', 'Individual', false, 100.00, 'Active', 0)
    RETURNING id
  ),
  -- Insert Donator 8: Norlida Ahmad
  d8 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, bounce_count)
    VALUES (uuid_generate_v4(), 'Norlida Ahmad', 'Household', false, 120.00, 'Active', 1)
    RETURNING id
  ),
  -- Insert Incoming 1: Hassan Basri
  i1 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, submitted_at)
    VALUES (uuid_generate_v4(), 'Hassan Basri', 'Individual', false, 50.00, 'Pending Giro', '2025-03-05')
    RETURNING id
  ),
  -- Insert Incoming 2: Aishah Sinclair
  i2 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, submitted_at)
    VALUES (uuid_generate_v4(), 'Aishah Sinclair', 'Household', true, 80.00, 'Pending e-Giro', '2025-03-04')
    RETURNING id
  ),
  -- Insert Incoming 3: Mawi World
  i3 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, submitted_at)
    VALUES (uuid_generate_v4(), 'Mawi World', 'Individual', false, 50.00, 'Pending Giro', '2025-03-01')
    RETURNING id
  ),
  -- Insert Incoming 4: Erra Fazira
  i4 AS (
    INSERT INTO donators (id, full_name, tier, is_discounted, monthly_amount, status, submitted_at)
    VALUES (uuid_generate_v4(), 'Erra Fazira', 'Household', false, 100.00, 'Pending e-Giro', '2025-02-28')
    RETURNING id
  )

-- INSERT HOUSEHOLD MEMBERS
INSERT INTO household_members (donator_id, full_name, relationship)
SELECT id, 'Datuk K', 'Immediate Family' FROM d2
UNION ALL SELECT id, 'Aafiyah Khalid', 'Immediate Family' FROM d2
UNION ALL SELECT id, 'Afwa Khalid', 'Immediate Family' FROM d2
UNION ALL SELECT id, 'Tarudin Ismail', 'Parent/In-law' FROM d2
UNION ALL SELECT id, 'Ali bin Abu', 'Immediate Family' FROM d4
UNION ALL SELECT id, 'Fatimah binti Ali', 'Immediate Family' FROM d4
UNION ALL SELECT id, 'Hassan bin Ali', 'Immediate Family' FROM d4
UNION ALL SELECT id, 'Mariam binti Yusof', 'Parent/In-law' FROM d4
UNION ALL SELECT id, 'Yusof bin Daud', 'Parent/In-law' FROM d4
UNION ALL SELECT id, 'Ibrahim bin Musa', 'Immediate Family' FROM d6
UNION ALL SELECT id, 'Sarah binti Ibrahim', 'Immediate Family' FROM d6
UNION ALL SELECT id, 'Musa bin Ahmad', 'Parent/In-law' FROM d6
UNION ALL SELECT id, 'Aminah binti Salleh', 'Parent/In-law' FROM d6
UNION ALL SELECT id, 'Ahmad bin Kassim', 'Immediate Family' FROM d8
UNION ALL SELECT id, 'Syafiq bin Ahmad', 'Immediate Family' FROM d8
UNION ALL SELECT id, 'Syahira binti Ahmad', 'Immediate Family' FROM d8
UNION ALL SELECT id, 'Kassim bin Baba', 'Parent/In-law' FROM d8
UNION ALL SELECT id, 'Adam Sinclair', 'Immediate Family' FROM i2
UNION ALL SELECT id, 'Bunga Sinclair', 'Immediate Family' FROM i2
UNION ALL SELECT id, 'Mohamed Sinclair', 'Parent/In-law' FROM i2
UNION ALL SELECT id, 'Kharsiah', 'Parent/In-law' FROM i2
UNION ALL SELECT id, 'Engku Emran', 'Immediate Family' FROM i4
UNION ALL SELECT id, 'Engku Aleesya', 'Immediate Family' FROM i4
UNION ALL SELECT id, 'Wan Chek', 'Parent/In-law' FROM i4
UNION ALL SELECT id, 'Fazira', 'Parent/In-law' FROM i4;

-- INSERT PAYMENTS (Sample for D1, D2, D3)
-- We need to retrieve IDs again or do this in a separate block if not using CTEs fully for everything.
-- Since we can't reference CTEs in a separate statement easily without a DO block or chaining, 
-- let's use a DO block for the payments to look up by name (assuming unique names for this seed).

DO $$
DECLARE
  d1_id uuid;
  d2_id uuid;
  d3_id uuid;
  d4_id uuid;
  d5_id uuid;
  d6_id uuid;
  d8_id uuid;
BEGIN
  SELECT id INTO d1_id FROM donators WHERE full_name = 'Ahmad bin Sulaiman';
  SELECT id INTO d2_id FROM donators WHERE full_name = 'Siti Nurhaliza';
  SELECT id INTO d3_id FROM donators WHERE full_name = 'Farid Kamil';
  SELECT id INTO d4_id FROM donators WHERE full_name = 'Zainab binti Ali';
  SELECT id INTO d5_id FROM donators WHERE full_name = 'Omar Abdullah';
  SELECT id INTO d6_id FROM donators WHERE full_name = 'Khadijah Ibrahim';
  SELECT id INTO d8_id FROM donators WHERE full_name = 'Norlida Ahmad';

  -- D1 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d1_id, 50.00, 'Paid', '2025-03-01'),
  (d1_id, 50.00, 'Paid', '2025-02-01'),
  (d1_id, 50.00, 'Paid', '2025-01-01'),
  (d1_id, 50.00, 'Paid', '2024-12-01');

  -- D2 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d2_id, 80.00, 'Bounced', '2025-03-01'),
  (d2_id, 80.00, 'Paid', '2025-02-01'),
  (d2_id, 80.00, 'Paid', '2025-01-01');

  -- D3 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d3_id, 30.00, 'Bounced', '2025-03-01'),
  (d3_id, 30.00, 'Bounced', '2025-02-01'),
  (d3_id, 30.00, 'Paid', '2025-01-01');

  -- D4 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d4_id, 100.00, 'Paid', '2025-03-01'),
  (d4_id, 100.00, 'Paid', '2025-02-01');

  -- D5 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d5_id, 25.00, 'Paid', '2025-03-01'),
  (d5_id, 25.00, 'Paid', '2025-02-01');

  -- D6 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d6_id, 0.00, 'No Record', '2025-03-01'),
  (d6_id, 60.00, 'Paid', '2025-02-01');

  -- D8 Payments
  INSERT INTO payments (donator_id, amount, status, payment_date) VALUES
  (d8_id, 120.00, 'Paid', '2025-03-01'),
  (d8_id, 120.00, 'Bounced', '2025-02-01');

END $$;
