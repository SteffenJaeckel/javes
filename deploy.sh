echo "prepare ..."
VERSION=$(node inc_version.js)
cd src/
echo "Make build"
pwd
meteor build --directory ../build/ubuntu --architecture os.linux.x86_64
cd ../build/ubuntu
pwd
echo "Delete old bundle.tar"
rm bundle.tar
echo "Create new bundle.tar"
tar -c --file bundle.tar bundle
echo "Delete bundle dir"
rm -R -f bundle
cd ../..
pwd
echo "Add new files to git"
git add build/ubuntu/bundle.tar
git add src/version.js
git commit -m "$VERSION erstellt."
git tag $VERSION
echo "[ok]"
