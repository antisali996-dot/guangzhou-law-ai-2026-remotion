import sys
import unittest
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'audio'))


class AudioTimingTests(unittest.TestCase):
    def test_detects_offset_and_rejects_missing_sound(self):
        from timeline_audio import measure
        rng = np.random.default_rng(20261024)
        source = rng.normal(0, 0.1, 2400)
        mix = np.zeros(24000)
        mix[12000:14400] = source * 0.4
        found, confidence = measure(mix, source, 1.0)
        self.assertAlmostEqual(found, 1.0, places=5)
        self.assertGreater(confidence, 0.99)
        wrong, _ = measure(mix, source, 0.9)
        self.assertGreater(abs(wrong - 0.9), 1 / 60)
        _, absent = measure(np.zeros_like(mix), source, 1.0)
        self.assertLess(absent, 0.05)

    def test_exports_entire_current_source_timeline(self):
        from timeline_audio import load_timeline
        manifest = load_timeline()
        self.assertEqual(len(manifest['voices']), 11)
        self.assertEqual(len(manifest['effects']), 17)
        self.assertEqual(manifest['totalFrames'], 5040)
        self.assertAlmostEqual(manifest['scoreGain'], 0.4)
        for cue in manifest['voices'] + manifest['effects']:
            self.assertTrue((Path(manifest['root']) / 'public' / cue['file']).is_file())

    def test_quiet_effect_is_located_after_identified_voice_is_removed(self):
        from timeline_audio import measure, subtract_templates
        rng = np.random.default_rng(24)
        voice = rng.normal(0, 1, 12000)
        effect = rng.normal(0, 0.01, 1200)
        mix = voice.copy()
        mix[6000:7200] += effect
        residual = subtract_templates(mix, [(0, voice)])
        found, confidence = measure(residual, effect, 0.5)
        self.assertAlmostEqual(found, 0.5, places=5)
        self.assertGreater(confidence, 0.99)
        missing = subtract_templates(voice, [(0, voice)])
        self.assertLess(measure(missing, effect, 0.5)[1], 0.05)


if __name__ == '__main__':
    unittest.main()
