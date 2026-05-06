pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
  }

  tools {
    nodejs 'NodeJS 24'
  }

  environment {
    APP_NAME = 'minolingo-frontend'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: scm.branches,
          userRemoteConfigs: scm.userRemoteConfigs,
          extensions: scm.extensions + [[$class: 'WipeWorkspace']]
        ])
      }
    }

    stage('Install') {
      steps {
        script {
          runCommand('npm ci')
        }
      }
    }

    stage('Unit Tests + Coverage') {
      steps {
        script {
          runCommand('npm run test:coverage')
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
      }
    }

    stage('SonarQube Scan') {
      steps {
        withSonarQubeEnv('SonarQube Frontend') {
          script {
            runCommand('npx sonar-scanner')
          }
        }
      }
    }

    stage('Production Build') {
      steps {
        script {
          runCommand('npm run build:prod')
        }
      }
      post {
        success {
          archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true
        }
      }
    }
  }

  post {
    success {
      echo 'Frontend CI completed: tests, SonarQube analysis, and production build passed.'
    }
  }
}

void runCommand(String command) {
  if (isUnix()) {
    sh command
  } else {
    bat command.replace(' || true', ' || exit 0')
  }
}
