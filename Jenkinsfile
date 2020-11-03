pipeline {
  agent { dockerfile true }

  environment {
    GM_API_KEY_DEV = credentials('google-maps-DEV-api-key')
    GM_API_KEY = credentials('google-maps-PROD-api-key')
    HOME = '.'
  }

  stages {
    stage('Geocode the data') {
      steps {
        sh 'cd src && python build.py'
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
            env.S3_BUNDLE_PATH = "maps.supplychainschool.co.uk${S3_BUNDLE_PATH}"
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
