-- Add rescuePhase to AnimalReport to track whether an assigned rescuer
-- is heading to the animal or heading to the clinic.
-- Nullable so existing rows are unaffected.
ALTER TABLE "AnimalReport" ADD COLUMN "rescuePhase" TEXT;
