# atg-shared-utilities CONTRIBUTION DOCUMENTATION

## Coding Standards

Code provided to atg-shared-utilities must NOT contain personal, private, or vulgar information or comments. No customer or other non-F5 originated data will be included. Third-party code cannot be used without first contacting the LRB. Failure to comply will result in the merge being denied and possible further penalties.

## F5 Networks Contributor License Agreement

Before you start contributing to any project sponsored by F5 Networks, Inc. (F5) on GitHub, you will need to sign a Contributor License Agreement (CLA).

If you are signing as an individual, we recommend that you talk to your employer (if applicable) before signing the CLA since some employment agreements may have restrictions on your contributions to other projects.
Otherwise by submitting a CLA you represent that you are legally entitled to grant the licenses recited therein.

If your employer has rights to intellectual property that you create, such as your contributions, you represent that you have received permission to make contributions on behalf of that employer, that your employer has waived such rights for your contributions, or that your employer has executed a separate CLA with F5.

If you are signing on behalf of a company, you represent that you are legally entitled to grant the license recited therein.
You represent further that each employee of the entity that submits contributions is authorized to submit such contributions on behalf of the entity pursuant to the CLA.

## Release process

Each step assumes you've completed the previous steps.

0. Navigate to the root directory of this project.

1. Update main with the latest from develop

2. Tag main

3. Push main to GitHub

4. Publish main to npm

5. Increment version numbers

### Update main with the latest from develop

Checkout the main branch:
*git checkout main*

Confirm you've pulled the latest version:
*git pull*

Bring the changes from origin/develop to main:
*git merge origin/develop*

If there was any differences push those changes to origin:
*git push*

### Tag main (via GUI)

Note: git can tag locally, however we have discovered it is easy to make a mistake during this process as such we highly suggest you do this through the GitLab GUI instead.

Log into the GUI via browser

Navigate to Repository > Tags

Click **New tag**

Fill in the form:

Tag name = "vVersion.Number" (e.g. v0.1.0-1)

Create from = "main"

Message = "Release version vVersion.Number"

Release notes = CHANGELOG entry for this version

Click **Create tag**

## Push main to GitHub

TO BE DETERMINED

### Publish to npm via terminal (requires npm permissions)

Log into npm using:
*npm login*

Confirm the changes you want pushed to npm:
*npm publish --dry-run*

Publish changes to npm
*npm publish --access public*

### Increment version

Now we must get ready for the next release

Switch back to develop:
*git checkout develop*

Increment the version number in package, package-lock, and CHANGELOG.

Push these changes to develop
*git add -up*
*git commit*
*git push*
