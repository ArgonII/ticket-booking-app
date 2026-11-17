
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "eu-north-1"
  profile = "lab5"
}

# Мережева інфраструктура Ticket Booking
module "vpc" {
  source = "./modules/vpc"

  environment = "ticket-booking-dev"
  vpc_cidr    = "10.20.0.0/16"
  public_subnets = [
    "10.20.1.0/24",
    "10.20.2.0/24"
  ]
}

# EC2 сервер для Ticket Booking
module "web_server" {
  source = "./modules/ec2"

  environment   = "ticket-booking-dev"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnet_ids[0]
  instance_type = "t3.micro"

  user_data = file("${path.module}/bootstrap.sh")
}

# Вихідні дані
output "vpc_id" {
  description = "Ticket Booking VPC ID"
  value       = module.vpc.vpc_id
}

output "server_public_ip" {
  description = "Ticket Booking EC2 public IP"
  value       = module.web_server.public_ip
}
