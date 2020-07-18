pipeline {
  agent {
    docker {
       image 'python:3.8-alpine'
    }
  }

  environment {
    HOME = '.'
  }

  stages {
    stage('Geocode the data') {
      steps {
        sh 'cd src/mep && python parse.py'
      }
    }

    stage('Deploy project to S3') {
      when {
        anyOf {
          branch 'master'
          branch 'stage'
        }
      }
      steps {
        script {
            if (env.BRANCH_NAME == 'master') {
                env.S3_BUNDLE_PATH = '/stable/'
            } else {
                env.S3_BUNDLE_PATH = '/latest/'
            }
            env.S3_BUNDLE_PATH = "maps.sustainabilitytool.com${S3_BUNDLE_PATH}"
        }
        echo "Uploading files to ${S3_BUNDLE_PATH}"
        withAWS(region: 'eu-west-2', credentials: 'docker_euwest2') {
          s3Delete(bucket:'procedural-frontend-bundles', path:"${S3_BUNDLE_PATH}")
          s3Upload(file: 'src/', bucket:'procedural-frontend-bundles', path:"${S3_BUNDLE_PATH}")
        }
      }
    }

  }

  post {
    always {
      cleanWs()
    }

    success {
      bitbucketStatusNotify(
        buildState: 'SUCCESSFUL',
        buildKey: 'js_build',
        buildName: 'JS Build',
        repoSlug: 'aso-client'
      )
    }

    failure {
      bitbucketStatusNotify(
        buildState: 'FAILED',
        buildKey: 'js_build',
        buildName: 'JS Build',
        repoSlug: 'aso-client'
      )
    }

  }
}