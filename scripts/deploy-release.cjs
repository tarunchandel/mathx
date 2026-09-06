/**
 * Deploy MathX Release Bundle to Google Play Console
 * Targets both 'internal' and 'alpha' (Closed Testing) tracks.
 */
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function deploy() {
  const keyPath = path.resolve(__dirname, '../android/app/service-account.json');
  const aabPath = path.resolve(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key not found at: ${keyPath}`);
  }
  if (!fs.existsSync(aabPath)) {
    throw new Error(`AAB bundle not found at: ${aabPath}`);
  }

  const aabSizeMb = (fs.statSync(aabPath).size / (1024 * 1024)).toFixed(2);
  console.log(`Starting deployment with bundle: ${aabPath} (${aabSizeMb} MB)`);

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });

  const publisher = google.androidpublisher({ version: 'v3', auth });
  const packageName = 'com.mathx.mastermind';

  console.log('1. Creating edit on Google Play Console...');
  const edit = await publisher.edits.insert({ packageName });
  const editId = edit.data.id;
  console.log(`   Edit created: ${editId}`);

  try {
    console.log('2. Uploading App Bundle (AAB)...');
    const uploadRes = await publisher.edits.bundles.upload({
      packageName,
      editId,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(aabPath),
      },
    });

    const versionCode = uploadRes.data.versionCode;
    console.log(`   Bundle uploaded successfully! VersionCode: ${versionCode}`);

    const releaseNotes = [
      {
        language: 'en-US',
        text: 'MathX v1.0.4: Comprehensive review & bugfix release. Fixes keyboard event listener multiplication, mental math explanation interaction & feedback, practice session coin alignment, shop category price sorting, avatar equipping synchronization, multi-defense shields, and profile backup import/export modals.'
      }
    ];

    const releasePayload = {
      name: '1.0.4',
      versionCodes: [String(versionCode)],
      status: 'completed',
      releaseNotes: releaseNotes,
    };

    console.log('3. Updating "internal" testing track...');
    await publisher.edits.tracks.update({
      packageName,
      editId,
      track: 'internal',
      requestBody: {
        track: 'internal',
        releases: [releasePayload],
      },
    });
    console.log('   Internal track updated.');

    console.log('4. Updating "alpha" (Closed Testing) track...');
    await publisher.edits.tracks.update({
      packageName,
      editId,
      track: 'alpha',
      requestBody: {
        track: 'alpha',
        releases: [releasePayload],
      },
    });
    console.log('   Alpha (closed testing) track updated.');

    console.log('5. Committing the edit...');
    const commitRes = await publisher.edits.commit({
      packageName,
      editId,
      changesNotSentForReview: false,
    });
    console.log(`   Edit committed successfully! Status: ${commitRes.status}`);
    console.log(`\n🎉 Successfully deployed MathX v1.0.4 (versionCode ${versionCode}) to Google Play Console on internal and closed (alpha) testing tracks!`);

  } catch (err) {
    console.error('Deployment error:', err.message);
    if (err.response && err.response.data) {
      console.error('Details:', JSON.stringify(err.response.data, null, 2));
    }
    try {
      console.log('Aborting edit...');
      await publisher.edits.delete({ packageName, editId });
    } catch (_) {}
    process.exit(1);
  }
}

deploy();
