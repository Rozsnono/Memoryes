const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'app', 'api');
const backupDir = path.join(root, 'api_backup_folder'); // Move outside of app/

async function build() {
    try {
        // 1. Move API out of app/ so Next.js doesn't see it
        if (fs.existsSync(apiDir)) {
            console.log('Moving API folder to safety...');
            fs.renameSync(apiDir, backupDir);
        }

        // 2. Clear .next cache to ensure a fresh start
        if (fs.existsSync(path.join(root, '.next'))) {
            fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
        }

        // 3. Run build with IS_MOBILE=true
        console.log('Starting Mobile Export...');
        execSync('npx cross-env IS_MOBILE=true next build', { stdio: 'inherit' });

        console.log('Export Complete! Folder "out" is ready.');
    } catch (err) {
        console.error('Build failed!', err);
    } finally {
        // 4. ALWAYS move the API folder back
        if (fs.existsSync(backupDir)) {
            console.log('Restoring API folder...');
            fs.renameSync(backupDir, apiDir);
        }
    }
}

build();