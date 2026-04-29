using FluentValidation;
using OhmERP.Application.DTOs.WorkCenter;
using OhmERP.Application.Interfaces.Repositories;

namespace OhmERP.Application.Validations.WorkCenter;

public class UpdateWorkCenterRequestValidator : AbstractValidator<UpdateWorkCenterRequest>
{
    private readonly IGenericRepository<OhmERP.Domain.Entities.WorkCenter> _repository;

    public UpdateWorkCenterRequestValidator(IGenericRepository<OhmERP.Domain.Entities.WorkCenter> repository)
    {
        _repository = repository;

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Makine Kodu boş olamaz.")
            .MaximumLength(50).WithMessage("Makine Kodu en fazla 50 karakter olabilir.")
            .MustAsync(BeUniqueCode).WithMessage("Aynı Makine Kodu sistemde zaten mevcuttur.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Makine Adı boş olamaz.")
            .MaximumLength(150).WithMessage("Makine Adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Kategori boş olamaz.");


    }

    private async Task<bool> BeUniqueCode(UpdateWorkCenterRequest request, string code, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code)) return true;
        
        var exists = await _repository.AnyAsync(x => x.Code == code.Trim() && x.Id != request.Id && !x.IsDeleted);
        return !exists;
    }
}
