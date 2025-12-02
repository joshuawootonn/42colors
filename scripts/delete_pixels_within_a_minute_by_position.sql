-- Delete pixels within a 2-minute range based on a reference pixel's timestamp
-- 
-- Usage: Replace the x and y coordinates below with the target pixel coordinates
-- This script will:
--   1. Find the pixel at the specified (x, y) coordinates
--   2. Use that pixel's timestamp (created_at or updated_at) as the reference
--   3. Delete all pixels within a 2-minute range (±1 minute) of that timestamp
--
-- Example: Find pixel at (100, 200) and delete all pixels within 2 minutes of its timestamp

-- Option 1: Using updated_at timestamp (modify x and y values)
DO $$
DECLARE
    target_x INTEGER :=91;  -- Replace with your x coordinate
    target_y INTEGER := 421;
    reference_timestamp TIMESTAMP;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    deleted_count INTEGER;
BEGIN
    -- Find the reference pixel and get its updated_at timestamp
    SELECT updated_at INTO reference_timestamp
    FROM pixels
    WHERE x = target_x AND y = target_y
    LIMIT 1;
    
    -- Check if pixel was found
    IF reference_timestamp IS NULL THEN
        RAISE EXCEPTION 'Pixel not found at coordinates (%, %)', target_x, target_y;
    END IF;
    
    -- Calculate the 2-minute range (±1 minute from reference timestamp)
    start_time := reference_timestamp - INTERVAL '1 minute';
    end_time := reference_timestamp + INTERVAL '1 minute';
    
    -- Delete pixels within the time range
    DELETE FROM pixels
    WHERE updated_at >= start_time
      AND updated_at <= end_time;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Reference pixel at (%, %) had timestamp: %', target_x, target_y, reference_timestamp;
    RAISE NOTICE 'Deleted % pixels between % and %', deleted_count, start_time, end_time;
END $$;
